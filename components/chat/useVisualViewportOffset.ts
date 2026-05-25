"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useVisualViewportOffset(
  targetRef: RefObject<HTMLElement | null>
): void {
  const rafIdRef = useRef<number | null>(null);
  const lastOffsetRef = useRef<number>(0);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const updateOffset = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (offset !== lastOffsetRef.current) {
        lastOffsetRef.current = offset;
        target.style.setProperty("--chat-keyboard-offset", `${offset}px`);
      }
    };

    const handleViewportChange = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateOffset);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    // Initial calculation
    handleViewportChange();

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // Reset to 0 on cleanup
      target.style.setProperty("--chat-keyboard-offset", "0px");
    };
  }, [targetRef]);
}
