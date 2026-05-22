/**
 * Dataset loader with assertion type validation
 */

import { readFileSync } from "fs";
import { join } from "path";
import type { EvalDataset, EvalCase } from "../types";
import { SUPPORTED_ASSERTION_TYPES } from "../types";

const DATASET_DIR = join(import.meta.dirname || ".", "../datasets");

const DATASET_FILES = [
  "safety_jailbreak.json",
  "response_quality.json",
  "persona_adherence.json",
  "boundary_testing.json",
  "factual_accuracy.json",
];

export interface LoadedDatasets {
  totalCases: number;
  datasets: Map<string, EvalDataset>;
  cases: EvalCase[];
}

/**
 * Load all dataset files and validate assertion types.
 * Exits with code 1 if any unsupported assertion types are found.
 */
export function loadDatasets(): LoadedDatasets {
  const datasets = new Map<string, EvalDataset>();
  const allCases: EvalCase[] = [];
  const unsupportedTypes = new Set<string>();
  const errors: string[] = [];

  for (const filename of DATASET_FILES) {
    const filepath = join(DATASET_DIR, filename);

    try {
      const content = readFileSync(filepath, "utf-8");
      const dataset: EvalDataset = JSON.parse(content);

      // Validate each case's assertions
      for (const case_ of dataset.cases) {
        for (const assertion of case_.assertions) {
          if (!SUPPORTED_ASSERTION_TYPES.includes(assertion.type as any)) {
            unsupportedTypes.add(assertion.type);
            errors.push(
              `${filename} → ${case_.id}: unsupported assertion type "${assertion.type}"`
            );
          }
        }
      }

      datasets.set(filename, dataset);
      allCases.push(...dataset.cases);
    } catch (error) {
      console.error(`Failed to load ${filename}:`, error);
      process.exit(1);
    }
  }

  // STOP if any unsupported assertion types found
  if (unsupportedTypes.size > 0) {
    console.error("\n=== ASSERTION TYPE VALIDATION FAILED ===");
    console.error("Unsupported assertion types found:");
    for (const type of unsupportedTypes) {
      console.error(`  - "${type}"`);
    }
    console.error("\nDetails:");
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    console.error("\nSupported types are:");
    for (const type of SUPPORTED_ASSERTION_TYPES) {
      console.error(`  - ${type}`);
    }
    console.error("\n=== EXITING ===");
    process.exit(1);
  }

  return {
    totalCases: allCases.length,
    datasets,
    cases: allCases,
  };
}

/**
 * Get category for a case by looking up in loaded datasets
 */
export function getCaseCategory(
  caseId: string,
  datasets: Map<string, EvalDataset>
): string {
  for (const [filename, dataset] of datasets) {
    if (dataset.cases.some((c) => c.id === caseId)) {
      return dataset.category;
    }
  }
  return "unknown";
}

// Self-test if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Loading datasets...");
  const loaded = loadDatasets();
  console.log(`Loaded ${loaded.totalCases} cases from ${DATASET_FILES.length} datasets`);

  // Show breakdown
  for (const [filename, dataset] of loaded.datasets) {
    console.log(`  - ${filename}: ${dataset.cases.length} cases (${dataset.category})`);
  }

  // Show all case IDs
  console.log("\nCase IDs:");
  for (const case_ of loaded.cases) {
    const types = case_.assertions.map((a) => a.type).join(", ");
    console.log(`  - ${case_.id}: ${types}`);
  }

  console.log("\nValidation passed!");
}
