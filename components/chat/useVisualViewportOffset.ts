"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Syncs visual viewport geometry to the conversation surface for keyboard and pinch-zoom.
 * Surface height tracks vv.height — do not also apply --chat-keyboard-offset on the dock.
 */
export function useVisualViewportOffset(
  targetRef: RefObject<HTMLElement | null>
): void {
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const syncViewport = () => {
      target.style.setProperty("--chat-vv-width", `${vv.width}px`);
      target.style.setProperty("--chat-vv-offset-left", `${vv.offsetLeft}px`);
      target.style.setProperty("--chat-vv-offset-top", `${vv.offsetTop}px`);
      target.style.setProperty("--chat-vv-height", `${vv.height}px`);
    };

    const handleViewportChange = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(syncViewport);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    handleViewportChange();

    return () => {
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      target.style.removeProperty("--chat-vv-width");
      target.style.removeProperty("--chat-vv-offset-left");
      target.style.removeProperty("--chat-vv-offset-top");
      target.style.removeProperty("--chat-vv-height");
    };
  }, [targetRef]);
}
