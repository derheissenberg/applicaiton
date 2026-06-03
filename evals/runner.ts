// Entry point for evals - re-exports from lib/runner.ts for cleaner import
export {
  runEvals,
  printSummary,
  getEvalExitCode,
  getFailureSeverity,
} from "./lib/runner.ts";

// Run if executed directly
import {
  runEvals,
  printSummary,
  getEvalExitCode,
} from "./lib/runner.ts";

async function main() {
  try {
    const run = await runEvals();
    printSummary(run);
    process.exit(getEvalExitCode(run));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
