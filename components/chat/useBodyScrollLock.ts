"use client";

import { useEffect } from "react";

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    
    return () => {
      html.style.overflow = prev;
    };
  }, [locked]);
}
