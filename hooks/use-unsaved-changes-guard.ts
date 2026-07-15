"use client";

import { useEffect } from "react";

/**
 * Warns on browser-level navigation (refresh, close, URL bar) while `when`
 * is true. Does not intercept in-app client-side navigation (e.g. sidebar
 * links) — Next.js App Router has no supported hook for that yet.
 */
export function useUnsavedChangesGuard(when: boolean) {
  useEffect(() => {
    if (!when) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);
}
