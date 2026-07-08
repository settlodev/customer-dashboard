"use client";

import { useCallback, useEffect, useRef } from "react";
import { BusinessDocument } from "./BusinessDocument";
import type { DocumentTheme } from "./BusinessDocument";
import type { BusinessDocumentData } from "./types";

interface PrintableDocumentProps {
  data: BusinessDocumentData;
  tableHeaderClassName?: string;
  /**
   * Per-tenant brand colours. Forwarded to {@link BusinessDocument}. When
   * unset, the document falls back to the default Tailwind palette.
   */
  theme?: DocumentTheme;
  /**
   * Filename hint used when the user prints to PDF. The browser will use this
   * as the suggested filename in some browsers (works in Chrome/Edge).
   */
  documentTitle?: string;
  /**
   * Open the print dialog automatically once the page (including the logo
   * image) has loaded — for dedicated print/download views opened in a new
   * tab. The toolbar stays available for re-printing after a cancel.
   */
  autoPrint?: boolean;
}

/**
 * Wraps BusinessDocument with a toolbar (Print to PDF / Download) and the
 * print-stylesheet that sizes the page to A4 and hides the toolbar on print.
 *
 * Usage:
 *   <PrintableDocument data={invoiceData} />
 *
 * To trigger print from elsewhere, just call `window.print()` — the print
 * styles will hide everything except the document itself.
 */
export function PrintableDocument({
  data,
  tableHeaderClassName,
  theme,
  documentTitle,
  autoPrint = false,
}: PrintableDocumentProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const previousTitle = document.title;
    if (documentTitle) document.title = documentTitle;
    window.print();
    // Restore after the print dialog closes — `afterprint` is reliable.
    const restore = () => {
      document.title = previousTitle;
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
    // Wait for `load` so images (logo) are in before the print snapshot.
    if (document.readyState === "complete") {
      const timer = setTimeout(fire, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    window.addEventListener("load", fire, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", fire);
    };
  }, [autoPrint, handlePrint]);

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Toolbar — mirrors the document wrapper so the button aligns with the
          document's right edge on every viewport. Hidden on print. */}
      <div className="mb-4 flex justify-center px-4 print:hidden">
        <div className="flex w-full max-w-[210mm] justify-end">
          <button
            onClick={handlePrint}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Document — A4 sized on screen and in print, centred horizontally */}
      <div ref={ref} className="print-page flex justify-center px-4 print:px-0">
        <BusinessDocument
          data={data}
          tableHeaderClassName={tableHeaderClassName}
          theme={theme}
          className="w-full max-w-[210mm] min-h-[297mm] overflow-hidden rounded-sm shadow-xl ring-1 ring-slate-200 print:max-w-none print:min-h-0 print:rounded-none print:shadow-none print:ring-0"
        />
      </div>

      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html,
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 0;
          }
          /* Avoid splitting line items across pages awkwardly */
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
