"use client";

import { useEffect, useRef, type RefObject } from "react";

const INPUT_GAP_PX = 12;
const TITLE_TOP_SAFE_PX = 12;

/**
 * While the hero input is focused, keep it inside the visual viewport above the
 * iOS keyboard — without pinning scrollY (which leaves the input under the keyboard).
 *
 * Uses CSS translateY on [data-hero-content] instead of window.scrollTo because the
 * page layout (html/body/main all min-height:100vh) is never taller than the layout
 * viewport, so maxScrollY === 0 and window.scrollTo() is a no-op on iOS.
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

    const getContentEl = () =>
      input.closest<HTMLElement>("[data-hero-content]");

    const resetTransform = () => {
      const el = getContentEl();
      if (el) el.style.transform = "";
    };

    const align = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const contentEl = getContentEl();
        // Reset any prior transform so getBoundingClientRect measures the true
        // (unshifted) layout position — avoids accumulated-delta errors across
        // successive vv.resize events during keyboard animation.
        if (contentEl) contentEl.style.transform = "";

        const inputRect = input.getBoundingClientRect();
        const visibleBottom = vv.offsetTop + vv.height - INPUT_GAP_PX;
        const overflow = inputRect.bottom - visibleBottom;

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

        if (contentEl) {
          contentEl.style.transform = `translateY(-${delta}px)`;
        } else {
          // Fallback: window.scrollTo works on desktop/Android where the
          // page can actually scroll.
          window.scrollTo(0, window.scrollY + delta);
        }
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
      resetTransform();
    };
  }, [active, inputRef]);
}
