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
      lastOffsetRef.current = offset;
      target.style.setProperty("--chat-keyboard-offset", `${offset}px`);
      target.style.setProperty("--chat-vv-width", `${vv.width}px`);
      target.style.setProperty("--chat-vv-offset-left", `${vv.offsetLeft}px`);
      target.style.setProperty("--chat-vv-height", `${vv.height}px`);
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
      target.style.removeProperty("--chat-keyboard-offset");
      target.style.removeProperty("--chat-vv-width");
      target.style.removeProperty("--chat-vv-offset-left");
      target.style.removeProperty("--chat-vv-height");
    };
  }, [targetRef]);
}
