/**
 * One-off spot check for company_context cases (not part of CI).
 * Usage: EVAL_BASE_URL=http://127.0.0.1:3000 npx tsx evals/scripts/spot-context-cases.ts ctx_a 6
 */
import { loadDatasets } from "../lib/load-datasets";
import { streamChat } from "../lib/chat-client";
import {
  evaluateAssertion,
  getNonJudgeAssertions,
  getJudgeAssertion,
} from "../lib/assertions";
import { evaluateJudgeWithRetries } from "../lib/judge";
import type { EvalCase } from "../types";

async function runCase(case_: EvalCase, category: string, sessionId: string) {
  const result = await streamChat({
    sessionId,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: case_.input }],
      },
    ],
  });
  const response = result.text;

  const nonJudge = getNonJudgeAssertions(case_.assertions);
  const assertionResults = nonJudge.map((a) => {
    const r = evaluateAssertion(response, a);
    return { type: a.type, passed: r.passed, message: r.message };
  });

  const judgeAssertion = getJudgeAssertion(case_.assertions);
  if (judgeAssertion) {
    const { result: jr } = await evaluateJudgeWithRetries(
      response,
      judgeAssertion,
      1
    );
    assertionResults.push({
      type: "judge" as const,
      passed: jr.passed,
      message: jr.message,
    });
  }

  const passed = assertionResults.every((r) => r.passed);
  return { caseId: case_.id, category, passed, assertionResults, response };
}

async function main() {
  const caseId = process.argv[2] || "ctx_a";
  const runs = parseInt(process.argv[3] || "1", 10);
  const { datasets } = loadDatasets();
  let case_: EvalCase | undefined;
  let category = "company_context";

  for (const [, dataset] of datasets) {
    const found = dataset.cases.find((c) => c.id === caseId);
    if (found) {
      case_ = found;
      category = dataset.category;
      break;
    }
  }

  if (!case_) {
    console.error(`Case not found: ${caseId}`);
    process.exit(1);
  }

  console.log(`Spot check: ${caseId} x${runs} (${case_.input})\n`);

  let passCount = 0;
  for (let i = 1; i <= runs; i++) {
    const sessionId = `spot-${caseId}-${Date.now()}-${i}`;
    try {
      const r = await runCase(case_, category, sessionId);
      if (r.passed) passCount += 1;
      console.log(`Run ${i}/${runs}: ${r.passed ? "PASS" : "FAIL"}`);
      if (!r.passed) {
        for (const a of r.assertionResults) {
          if (!a.passed) console.log(`  - ${a.type}: ${a.message}`);
        }
      }
      if (i === 1) {
        console.log(`  Response preview: ${r.response.slice(0, 200)}...\n`);
      }
    } catch (e) {
      console.log(`Run ${i}/${runs}: ERROR ${e instanceof Error ? e.message : e}`);
    }
    if (i < runs) await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n${passCount}/${runs} passed`);
  process.exit(passCount === runs ? 0 : 1);
}

main();
