/**
 * Eval Runner
 *
 * Runs eval cases sequentially against the chat API and evaluates responses.
 *
 * DESIGN NOTES:
 *
 * 1. JUDGE STABILITY: Cases with judge assertions use retry logic for stability.
 *    - If a judge assertion fails, we retry up to 3 times total
 *    - Only if all 3 attempts fail do we mark the case as failed
 *    - This handles LLM judge variability (same input can get different judgments)
 *
 * 2. HTTP RETRIES: Network failures (429 rate limit, 5xx server errors) are retried
 *    with exponential backoff. Max 3 retries per request.
 *
 * 3. RATE LIMITING: Sequential execution with 6.5s delay between cases to respect
 *    the 10/60s rate limit. No route bypassing.
 *
 * 4. EXIT BEHAVIOR: Collects ALL failures before exiting. Exit code 1 if any
 *    case fails, 0 if all pass. Never exits early on first failure.
 */

import fs from "fs";
import path from "path";
import { streamChat } from "./chat-client";
import { loadDatasets, getCaseCategory } from "./load-datasets";
import {
  evaluateAssertion,
  getNonJudgeAssertions,
  getJudgeAssertion,
} from "./assertions";
import { evaluateJudgeWithRetries } from "./judge";
import type {
  EvalCase,
  EvalResult,
  EvalRun,
  AssertionType,
} from "../types";

const EVAL_DELAY_MS = parseInt(process.env.EVAL_DELAY_MS || "7000", 10);
const SESSION_ID =
  process.env.EVAL_SESSION_ID || `eval-${Date.now()}`;
const MAX_HTTP_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Sleep for ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run a single case with HTTP retry logic
 */
async function runCaseWithRetries(
  case_: EvalCase,
  category: string,
  sessionId: string
): Promise<EvalResult> {
  let lastError: Error | null = null;
  let response = "";

  // HTTP retries with exponential backoff
  for (let attempt = 1; attempt <= MAX_HTTP_RETRIES; attempt++) {
    try {
      const startTime = Date.now();
      const result = await streamChat({
        sessionId,
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: case_.input }],
          },
        ],
      });
      const durationMs = Date.now() - startTime;

      response = result.text;
      break; // Success - exit retry loop
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable =
        lastError.message.includes("429") ||
        lastError.message.includes("5") ||
        lastError.message.includes("timeout") ||
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("ETIMEDOUT");

      if (isRetryable && attempt < MAX_HTTP_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.log(`  HTTP retry ${attempt}/${MAX_HTTP_RETRIES} after ${backoff}ms: ${lastError.message}`);
        await sleep(backoff);
      } else {
        break; // Non-retryable error or max retries reached
      }
    }
  }

  // If all HTTP retries failed
  if (!response && lastError) {
    return {
      caseId: case_.id,
      category,
      input: case_.input,
      response: "",
      passed: false,
      assertions: [
        {
          type: "contains_any" as AssertionType,
          passed: false,
          message: `HTTP failed after ${MAX_HTTP_RETRIES} attempts: ${lastError.message}`,
        },
      ],
      durationMs: 0,
    };
  }

  // Evaluate non-judge assertions
  const nonJudgeAssertions = getNonJudgeAssertions(case_.assertions);
  const assertionResults = nonJudgeAssertions.map((assertion) => {
    const result = evaluateAssertion(response, assertion);
    return {
      type: assertion.type as AssertionType,
      passed: result.passed,
      message: result.message,
    };
  });

  // Evaluate judge assertion if present (with stability retries)
  const judgeAssertion = getJudgeAssertion(case_.assertions);
  let judgeRetries = 0;

  if (judgeAssertion) {
    const { result, retries } = await evaluateJudgeWithRetries(
      response,
      judgeAssertion,
      3
    );
    judgeRetries = retries;
    assertionResults.push({
      type: "judge" as AssertionType,
      passed: result.passed,
      message: result.message,
    });
  }

  // Overall pass if all assertions pass
  const passed = assertionResults.every((r) => r.passed);

  return {
    caseId: case_.id,
    category,
    input: case_.input,
    response,
    passed,
    assertions: assertionResults,
    durationMs: 0,
    retries: judgeRetries > 0 ? judgeRetries : undefined,
  };
}

/**
 * Write results to file
 */
function writeResultsFile(run: EvalRun): void {
  const resultsDir = path.join(process.cwd(), "evals", "results");
  fs.mkdirSync(resultsDir, { recursive: true });
  const filename = path.join(resultsDir, `eval-${run.sessionId}.json`);
  fs.writeFileSync(filename, JSON.stringify(run, null, 2));
  console.log(`Results written to: ${filename}`);
}

/**
 * Run all eval cases
 */
export async function runEvals(): Promise<EvalRun> {
  // Validate ANTHROPIC_API_KEY at start
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY is required but not set");
    process.exit(1);
  }

  const startTime = Date.now();

  console.log(`\n=== Starting Eval Run ===`);
  console.log(`Session ID: ${SESSION_ID}`);
  console.log(`Delay between cases: ${EVAL_DELAY_MS}ms`);
  console.log("");

  // Load datasets
  const { cases, datasets } = loadDatasets();
  console.log(`Running ${cases.length} eval cases...\n`);

  const results: EvalResult[] = [];

  // Run cases sequentially
  for (let i = 0; i < cases.length; i++) {
    const case_ = cases[i];
    const category = getCaseCategory(case_.id, datasets);

    console.log(`[${i + 1}/${cases.length}] ${case_.id} (${category})`);
    console.log(`  Input: ${case_.input.slice(0, 60)}...`);

    const result = await runCaseWithRetries(case_, category, SESSION_ID);
    results.push(result);

    if (result.passed) {
      console.log(`  ✓ PASS${result.retries ? ` (judge retried ${result.retries}x)` : ""}`);
    } else {
      console.log(`  ✗ FAIL`);
      for (const assertion of result.assertions) {
        if (!assertion.passed) {
          console.log(`    - ${assertion.type}: ${assertion.message}`);
        }
      }
    }

    // Delay between cases (skip after last case)
    if (i < cases.length - 1) {
      await sleep(EVAL_DELAY_MS);
    }
  }

  // Calculate results
  const passedCases = results.filter((r) => r.passed).length;
  const failedCases = results.length - passedCases;
  const durationMs = Date.now() - startTime;

  const run: EvalRun = {
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
    totalCases: cases.length,
    passedCases,
    failedCases,
    durationMs,
    results,
  };

  // Ensure results directory exists and write results file
  fs.mkdirSync(path.join(process.cwd(), "evals", "results"), { recursive: true });
  writeResultsFile(run);

  return run;
}

/**
 * Print summary and exit
 */
function printSummary(run: EvalRun): void {
  console.log(`\n=== Eval Summary ===`);
  console.log(`Session ID: ${run.sessionId}`);
  console.log(`Total: ${run.totalCases} cases`);
  console.log(`Passed: ${run.passedCases} ✓`);
  console.log(`Failed: ${run.failedCases} ✗`);
  console.log(`Duration: ${(run.durationMs / 1000).toFixed(1)}s`);

  if (run.failedCases > 0) {
    console.log(`\nFailed cases:`);
    for (const result of run.results) {
      if (!result.passed) {
        console.log(`  - ${result.caseId} (${result.category})`);
      }
    }
  }

  console.log("");
}

/**
 * Main entry point
 */
async function main() {
  try {
    const run = await runEvals();
    printSummary(run);

    // Exit with appropriate code
    process.exit(run.failedCases > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
