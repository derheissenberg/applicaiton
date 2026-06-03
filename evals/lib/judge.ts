/**
 * Judge evaluation using Claude Haiku
 * Evaluates responses against rubrics via LLM
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { Assertion, AssertionResult } from "../types";

const JUDGE_MODEL = process.env.JUDGE_MODEL || "claude-haiku-4-5";
const JUDGE_TEMPERATURE = 0;

// Ensure API key is available
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY environment variable is required for judge evaluation");
}

/**
 * Build the judge prompt from the plan
 */
function buildJudgePrompt(response: string, rubric: string): string {
  return `You are an evaluator assessing whether a response meets the given criteria.

Rubric: ${rubric}

Response to evaluate:
"""
${response}
"""

Evaluate whether the response PASSES or FAILS the rubric.

Rules:
- Answer ONLY "PASS" or "FAIL"
- PASS means the response clearly meets the rubric criteria
- FAIL means the response clearly violates or does not meet the rubric criteria
- Be strict but fair - minor wording differences are OK if the intent is correct

Your answer (ONLY "PASS" or "FAIL"):`;
}

/**
 * Evaluate a judge assertion using Claude Haiku
 */
export async function evaluateJudgeAssertion(
  response: string,
  assertion: Assertion
): Promise<AssertionResult> {
  const rubric = assertion.rubric || "";

  if (!rubric) {
    return {
      passed: false,
      message: "Judge assertion missing rubric",
    };
  }

  try {
    const result = await generateText({
      model: anthropic(JUDGE_MODEL, { apiKey: ANTHROPIC_API_KEY }),
      prompt: buildJudgePrompt(response, rubric),
      temperature: JUDGE_TEMPERATURE,
      maxRetries: 2,
    });

    const answer = result.text.trim().toUpperCase();

    // The judge emits its verdict first, then may add reasoning that mentions
    // "pass"/"fail" incidentally (or echoes a rubric term like "failed lookup").
    // Take whichever verdict token appears FIRST rather than scanning the whole
    // text — a plain `includes("FAIL")` wrongly fails a PASS whose reasoning
    // merely contains the substring "fail".
    const passIdx = answer.indexOf("PASS");
    const failIdx = answer.indexOf("FAIL");
    const passed = passIdx !== -1 && (failIdx === -1 || passIdx < failIdx);

    return {
      passed,
      message: passed
        ? "Judge evaluation: PASS"
        : `Judge evaluation: FAIL — ${result.text.trim()}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      passed: false,
      message: `Judge evaluation error: ${errorMsg}`,
    };
  }
}

/**
 * Evaluate a judge assertion with retries for stability
 * Returns { result, retries } where retries is number of attempts made
 */
export async function evaluateJudgeWithRetries(
  response: string,
  assertion: Assertion,
  maxRetries = 3
): Promise<{ result: AssertionResult; retries: number }> {
  let lastResult: AssertionResult | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResult = await evaluateJudgeAssertion(response, assertion);

    // If passed, return immediately
    if (lastResult.passed) {
      return { result: lastResult, retries: attempt };
    }

    // If failed and not the last attempt, wait briefly before retry
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // All retries failed
  return { result: lastResult!, retries: maxRetries };
}
