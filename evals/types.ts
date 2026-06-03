/**
 * Evals type definitions
 */

export const SUPPORTED_ASSERTION_TYPES = [
  "contains_any",
  "not_contains",
  "regex",
  "word_count_max",
  "judge",
] as const;

export type AssertionType = (typeof SUPPORTED_ASSERTION_TYPES)[number];

export interface Assertion {
  type: AssertionType;
  // For contains_any
  values?: string[];
  // For not_contains
  values_not?: string[];
  // For regex
  pattern?: string;
  // For word_count_max
  value?: number;
  // For judge
  rubric?: string;
  // Failure severity for this specific assertion. Omitted = "hard" (fails the
  // job). "soft" assertions are reported as warnings but do not fail CI.
  severity?: EvalFailureSeverity;
}

export interface EvalCase {
  id: string;
  description: string;
  input: string;
  assertions: Assertion[];
}

export interface EvalDataset {
  category: string;
  description: string;
  cases: EvalCase[];
}

export interface EvalResult {
  caseId: string;
  category: string;
  input: string;
  response: string;
  passed: boolean;
  assertions: Array<{
    type: AssertionType;
    passed: boolean;
    message: string;
    severity?: EvalFailureSeverity;
  }>;
  durationMs: number;
  retries?: number;
}

export type EvalFailureSeverity = "hard" | "soft";

export interface EvalRun {
  timestamp: string;
  sessionId: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  hardFailedCases: number;
  softFailedCases: number;
  durationMs: number;
  results: EvalResult[];
}
