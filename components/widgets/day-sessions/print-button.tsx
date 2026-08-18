"use client";

import { Download } from "lucide-react";

/**
 * Export button for the Close-of-Day dashboard. Triggers the browser
 * print dialog (which offers "Save as PDF"), matching the design's
 * @media print rules on the page. Kept as a tiny client island so the
 * dashboard page itself can stay a server component.
 */
export function ExportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-card px-[13px] text-[13px] font-semibold text-ink-2 transition-colors hover:bg-canvas"
    >
      <Download className="h-[15px] w-[15px] text-ink-3" />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
