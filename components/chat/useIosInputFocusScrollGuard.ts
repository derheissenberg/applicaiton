"use client";

import { useEffect } from "react";

/** iOS auto-scroll-on-focus typically fires within ~100–200ms. */
const GUARD_MS = 400;

/**
 * Briefly prevents iOS Safari from scrolling the page when a hero input receives focus.
 * Listeners detach after GUARD_MS — not held for the full focus lifetime.
 */
export function useIosInputFocusScrollGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const targetScrollY = window.scrollY;
    let rafId: number | null = null;
    let detached = false;

    const guard = () => {
      if (detached) return;
      if (window.scrollY === targetScrollY) return;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (detached) return;
        if (window.scrollY === targetScrollY) return;
        window.scrollTo(0, targetScrollY);
      });
    };

    const vv = window.visualViewport;
    window.addEventListener("scroll", guard, { passive: true });
    vv?.addEventListener("scroll", guard);

    const timeoutId = window.setTimeout(() => {
      detached = true;
      window.removeEventListener("scroll", guard);
      vv?.removeEventListener("scroll", guard);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }, GUARD_MS);

    return () => {
      detached = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", guard);
      vv?.removeEventListener("scroll", guard);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [active]);
}
