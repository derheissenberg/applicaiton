"use client";

import { useEffect, useRef, type RefObject } from "react";

const INPUT_GAP_PX = 12;
const TITLE_TOP_SAFE_PX = 12;

/**
 * While the hero input is focused, keep it inside the visual viewport above the
 * iOS keyboard — without pinning scrollY (which leaves the input under the keyboard).
 */
export function useHeroInputKeyboardAlign(
  active: boolean,
  inputRef: RefObject<HTMLInputElement | null>
) {
  const scrollYAtFocusRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const input = inputRef.current;
    const vv = window.visualViewport;
    if (!input || !vv) return;

    scrollYAtFocusRef.current = window.scrollY;
    let rafId: number | null = null;

    const align = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const inputRect = input.getBoundingClientRect();
        const visibleBottom = vv.offsetTop + vv.height - INPUT_GAP_PX;
        const overflow = inputRect.bottom - visibleBottom;

        // #region agent log
        fetch("http://127.0.0.1:7336/ingest/d59e9ced-9d47-44ed-8229-0f50553ae11f", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "7e412f",
          },
          body: JSON.stringify({
            sessionId: "7e412f",
            location: "useHeroInputKeyboardAlign.ts:align",
            message: "hero keyboard align",
            data: {
              scrollY: window.scrollY,
              scrollYAtFocus: scrollYAtFocusRef.current,
              vvHeight: vv.height,
              vvOffsetTop: vv.offsetTop,
              inputBottom: inputRect.bottom,
              visibleBottom,
              overflow,
            },
            timestamp: Date.now(),
            hypothesisId: "A",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion

        if (overflow <= 0) return;

        let delta = overflow;
        const titleEl = document.querySelector(".chat-hero-min-height h2");
        if (titleEl instanceof HTMLElement) {
          const titleTop = titleEl.getBoundingClientRect().top;
          const minTitleTop = vv.offsetTop + TITLE_TOP_SAFE_PX;
          if (titleTop - delta < minTitleTop) {
            delta = Math.max(0, titleTop - minTitleTop);
          }
        }

        if (delta <= 0) return;

        const nextScrollY = window.scrollY + delta;
        window.scrollTo(0, nextScrollY);

        // #region agent log
        fetch("http://127.0.0.1:7336/ingest/d59e9ced-9d47-44ed-8229-0f50553ae11f", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "7e412f",
          },
          body: JSON.stringify({
            sessionId: "7e412f",
            location: "useHeroInputKeyboardAlign.ts:scroll",
            message: "hero scrollBy for keyboard",
            data: { delta, nextScrollY },
            timestamp: Date.now(),
            hypothesisId: "A",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
      });
    };

    vv.addEventListener("resize", align);
    vv.addEventListener("scroll", align);
    align();

    return () => {
      vv.removeEventListener("resize", align);
      vv.removeEventListener("scroll", align);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [active, inputRef]);
}
