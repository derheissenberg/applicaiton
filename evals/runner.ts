// Entry point for evals - re-exports from lib/runner.ts for cleaner import
export { runEvals } from "./lib/runner.ts";

// Run if executed directly
import { runEvals } from "./lib/runner.ts";

async function main() {
  try {
    const run = await runEvals();

    // Print summary
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
          for (const assertion of result.assertions) {
            if (!assertion.passed) {
              console.log(`    - ${assertion.type}: ${assertion.message}`);
            }
          }
        }
      }
    }

    console.log("");
    process.exit(run.failedCases > 0 ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
