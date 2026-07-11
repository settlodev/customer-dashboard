"use client";

import { useCallback, useEffect } from "react";
import { Printer } from "lucide-react";

/**
 * Print frame for the Close-of-Day report. Mirrors the app's
 * `PrintableDocument` convention (centred A4 sheet on a slate backdrop,
 * a "Print / Save as PDF" toolbar hidden on print, and the A4 @page
 * stylesheet) — but renders arbitrary `children` so the report sheet can
 * stay a server component instead of being locked to `BusinessDocument`.
 */
export function ReportPrintFrame({
  children,
  documentTitle,
  autoPrint = false,
}: {
  children: React.ReactNode;
  /** Filename hint Chrome/Edge use when printing to PDF. */
  documentTitle?: string;
  /** Open the print dialog once the sheet (incl. logo) has loaded. */
  autoPrint?: boolean;
}) {
  const handlePrint = useCallback(() => {
    const previous = document.title;
    if (documentTitle) document.title = documentTitle;
    window.print();
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
  }, [documentTitle]);

  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    const fire = () => {
      if (!cancelled) handlePrint();
    };
    if (document.readyState === "complete") {
      const t = setTimeout(fire, 300);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    window.addEventListener("load", fire, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", fire);
    };
  }, [autoPrint, handlePrint]);

  return (
    <div className="py-8 print:py-0">
      <div className="mb-4 flex justify-center px-4 print:hidden">
        <div className="flex w-full max-w-[920px] justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="flex justify-center px-4 print:px-0">{children}</div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr,
          td,
          th {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
}
