"use client";

import { useEffect } from "react";

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7336/ingest/d59e9ced-9d47-44ed-8229-0f50553ae11f";
const SESSION_ID = "7e412f";

type OverflowEntry = {
  tag: string;
  class: string;
  width: number;
  right: number;
  viewport: number;
};

function collectOverflowElements(): OverflowEntry[] {
  const viewport = window.innerWidth;
  return Array.from(document.querySelectorAll("*"))
    .filter((el) => el.getBoundingClientRect().right > viewport + 1)
    .map((el) => ({
      tag: el.tagName,
      class: typeof el.className === "string" ? el.className : "",
      width: el.getBoundingClientRect().width,
      right: el.getBoundingClientRect().right,
      viewport,
    }));
}

function sendOverflowLog(
  hypothesisId: string,
  message: string,
  data: Record<string, unknown>,
  runId = "pre-fix"
) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      runId,
      hypothesisId,
      location: "useOverflowDiagnostic.ts",
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

/**
 * Debug-only: reports elements wider than the viewport.
 * Remove after overflow fix is verified on device.
 */
export function useOverflowDiagnostic(
  enabled = process.env.NODE_ENV === "development"
) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const run = (trigger: string) => {
      const overflow = collectOverflowElements();
      const docWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;

      sendOverflowLog("ALL", "overflow scan", {
        trigger,
        viewport: window.innerWidth,
        docScrollWidth: docWidth,
        bodyScrollWidth: bodyWidth,
        hasHorizontalOverflow: docWidth > window.innerWidth + 1,
        overflowCount: overflow.length,
        topOffenders: overflow.slice(0, 8),
      });

      // Hypothesis A: hero headline
      const heroTitle = document.querySelector(".chat-hero-min-height h2");
      if (heroTitle) {
        const rect = heroTitle.getBoundingClientRect();
        sendOverflowLog("A", "hero title bounds", {
          width: rect.width,
          right: rect.right,
          viewport: window.innerWidth,
          overflows: rect.right > window.innerWidth + 1,
        });
      }

      // Hypothesis B: input shell
      const inputShell = document.querySelector(".chat-input-shell");
      if (inputShell) {
        const rect = inputShell.getBoundingClientRect();
        sendOverflowLog("B", "input shell bounds", {
          width: rect.width,
          right: rect.right,
          viewport: window.innerWidth,
          overflows: rect.right > window.innerWidth + 1,
        });
      }

      // Hypothesis E: conversation vignette pseudo (approximate via surface)
      const surface = document.querySelector(".chat-conversation-surface");
      if (surface) {
        const rect = surface.getBoundingClientRect();
        sendOverflowLog("E", "conversation surface bounds", {
          width: rect.width,
          right: rect.right,
          viewport: window.innerWidth,
          overflows: rect.right > window.innerWidth + 1,
        });
      }
    };

    const schedule = (trigger: string) => {
      requestAnimationFrame(() => run(trigger));
    };

    const handleResize = () => schedule("resize");
    const handleVisualViewport = () => schedule("visualViewport");

    schedule("mount");
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleVisualViewport);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleVisualViewport);
    };
  }, [enabled]);
}
