/**
 * Assertion evaluation functions
 */

import type { Assertion } from "../types";

export interface AssertionResult {
  passed: boolean;
  message: string;
}

/**
 * Evaluate a single assertion against a response
 */
export function evaluateAssertion(
  response: string,
  assertion: Assertion
): AssertionResult {
  const responseLower = response.toLowerCase();

  switch (assertion.type) {
    case "contains_any": {
      const values = assertion.values || [];
      const passed = values.some((v) =>
        response.toLowerCase().includes(v.toLowerCase())
      );
      return {
        passed,
        message: passed
          ? `Found one of: ${values.join(", ")}`
          : `Expected to find one of: ${values.join(", ")}`,
      };
    }

    case "not_contains": {
      const values = assertion.values || [];
      const found = values.filter((v) =>
        response.toLowerCase().includes(v.toLowerCase())
      );
      const passed = found.length === 0;
      return {
        passed,
        message: passed
          ? `None found from forbidden list`
          : `Forbidden content found: ${found.join(", ")}`,
      };
    }

    case "regex": {
      const pattern = assertion.pattern || "";
      try {
        const regex = new RegExp(pattern, "i");
        const passed = regex.test(response);
        return {
          passed,
          message: passed
            ? `Matched pattern: ${pattern}`
            : `Expected to match pattern: ${pattern}`,
        };
      } catch (e) {
        return {
          passed: false,
          message: `Invalid regex pattern: ${pattern}`,
        };
      }
    }

    case "word_count_max": {
      const maxWords = assertion.value || 0;
      const words = response.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const passed = wordCount <= maxWords;
      return {
        passed,
        message: passed
          ? `Word count ${wordCount} <= ${maxWords}`
          : `Word count ${wordCount} exceeds max ${maxWords}`,
      };
    }

    case "judge":
      // Judge assertions are handled separately by judge.ts
      return {
        passed: false, // Placeholder - judge must be called separately
        message: "Judge assertion requires LLM evaluation",
      };

    default:
      return {
        passed: false,
        message: `Unknown assertion type`,
      };
  }
}

/**
 * Check if an assertion is a judge assertion
 */
export function isJudgeAssertion(assertion: Assertion): boolean {
  return assertion.type === "judge";
}

/**
 * Get all non-judge assertions from a list
 */
export function getNonJudgeAssertions(assertions: Assertion[]): Assertion[] {
  return assertions.filter((a) => a.type !== "judge");
}

/**
 * Get judge assertion if present
 */
export function getJudgeAssertion(
  assertions: Assertion[]
): Assertion | undefined {
  return assertions.find((a) => a.type === "judge");
}
