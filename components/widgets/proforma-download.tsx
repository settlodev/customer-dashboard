"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ProformaDownloadButtonProps {
  proformaNumber: string;
  /** Set to true to auto-trigger download on mount (e.g. /receipt/:id?download=1) */
  autoDownload?: boolean;
  className?: string;
}

const ProformaDownloadButton = ({
  proformaNumber,
  autoDownload = false,
  className,
}: ProformaDownloadButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    const el = document.getElementById("receipt-content");
    if (!el) {
      console.error("ProformaDownloadButton: #receipt-content not found");
      return;
    }

    setLoading(true);

    try {
      // ── 1. Snapshot original inline styles ──────────────────────────────
      const saved = {
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        margin: el.style.margin,
        padding: el.style.padding,
        transform: el.style.transform,
        position: el.style.position,
        backgroundColor: el.style.backgroundColor,
        borderRadius: el.style.borderRadius,
        boxShadow: el.style.boxShadow,
      };

      // ── 2. Normalise layout for capture ────────────────────────────────
      Object.assign(el.style, {
        width: "794px",
        maxWidth: "794px",
        margin: "0",
        padding: "0",
        transform: "none",
        position: "relative",
        backgroundColor: "white",
        borderRadius: "0",
        boxShadow: "none",
      });

      // Wait for layout to settle + images to load
      await new Promise((r) => setTimeout(r, 120));
      const imgs = el.querySelectorAll("img");
      await Promise.all(
        Array.from(imgs).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((r) => {
            img.onload = r;
            img.onerror = r;
            setTimeout(r, 4000);
          });
        }),
      );

      // ── 3. Render to canvas ─────────────────────────────────────────────
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: el.scrollHeight,
        windowWidth: 1200,
        windowHeight: el.scrollHeight + 100,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (doc) => {
          const clone = doc.getElementById("receipt-content");
          if (!clone) return;

          // Base reset
          Object.assign(clone.style, {
            width: "794px",
            maxWidth: "794px",
            margin: "0",
            padding: "0",
            transform: "none",
            position: "relative",
            backgroundColor: "white",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#111827",
          });

          // Force all elements visible
          clone.querySelectorAll<HTMLElement>("*").forEach((el) => {
            el.style.visibility = "visible";
            el.style.opacity = "1";
            (el.style as any).printColorAdjust = "exact";
            (el.style as any).webkitPrintColorAdjust = "exact";
            el.style.fontFamily = "inherit";
          });

          // ── Accent gradient bar ──
          const accentBar = clone.querySelector<HTMLElement>(".h-1\\.5");
          if (accentBar) {
            accentBar.style.height = "6px";
            accentBar.style.background =
              "linear-gradient(to right, #10b981, #34d399, #6366f1)";
            accentBar.style.printColorAdjust = "exact";
            (accentBar.style as any).webkitPrintColorAdjust = "exact";
          }

          // ── Headings ──
          clone.querySelectorAll<HTMLElement>("h1,h2,h3,h4").forEach((h) => {
            h.style.fontSize = "13px";
            h.style.fontWeight = "700";
            h.style.color = "#111827";
            h.style.lineHeight = "1.3";
            h.style.margin = "0 0 4px";
          });

          // ── Body copy ──
          clone.querySelectorAll<HTMLElement>("p, span, li").forEach((el) => {
            if (!el.closest("h1,h2,h3,h4,th")) {
              el.style.fontSize = "10px";
              el.style.lineHeight = "1.5";
              if (
                el.classList.contains("text-gray-400") ||
                el.classList.contains("text-gray-500") ||
                el.classList.contains("text-gray-600")
              ) {
                el.style.color = "#6b7280";
              } else if (
                el.classList.contains("text-emerald-600") ||
                el.classList.contains("text-emerald-700")
              ) {
                el.style.color = "#059669";
              } else if (el.classList.contains("text-red-500")) {
                el.style.color = "#ef4444";
              } else {
                el.style.color = "#374151";
              }
            }
          });

          // ── "PROFORMA INVOICE" label ──
          clone
            .querySelectorAll<HTMLElement>("[class*='text-emerald']")
            .forEach((el) => {
              if (el.textContent?.toUpperCase().includes("PROFORMA INVOICE")) {
                el.style.fontSize = "9px";
                el.style.fontWeight = "800";
                el.style.letterSpacing = "0.1em";
                el.style.color = "#059669";
                el.style.backgroundColor = "#ecfdf5";
                el.style.padding = "3px 8px";
                el.style.borderRadius = "4px";
                el.style.display = "inline-block";
              }
            });

          // ── Status badge ──
          clone
            .querySelectorAll<HTMLElement>("[class*='rounded-full']")
            .forEach((badge) => {
              badge.style.fontSize = "8px";
              badge.style.fontWeight = "600";
              badge.style.padding = "2px 8px";
              badge.style.borderRadius = "9999px";
              badge.style.display = "inline-flex";
              badge.style.alignItems = "center";
              badge.style.gap = "4px";
              badge.style.lineHeight = "1.6";

              if (
                badge.classList.contains("bg-green-50") ||
                badge.classList.contains("text-green-700")
              ) {
                badge.style.backgroundColor = "#f0fdf4";
                badge.style.color = "#15803d";
                badge.style.border = "1px solid #bbf7d0";
              } else if (
                badge.classList.contains("bg-amber-50") ||
                badge.classList.contains("text-amber-700")
              ) {
                badge.style.backgroundColor = "#fffbeb";
                badge.style.color = "#b45309";
                badge.style.border = "1px solid #fde68a";
              } else if (
                badge.classList.contains("bg-red-50") ||
                badge.classList.contains("text-red-700")
              ) {
                badge.style.backgroundColor = "#fef2f2";
                badge.style.color = "#b91c1c";
                badge.style.border = "1px solid #fecaca";
              } else if (badge.classList.contains("bg-gray-50")) {
                badge.style.backgroundColor = "#f9fafb";
                badge.style.color = "#4b5563";
                badge.style.border = "1px solid #e5e7eb";
              }
            });

          // ── Business logo placeholder ──
          clone
            .querySelectorAll<HTMLElement>(
              "[class*='bg-emerald-500'][class*='rounded-xl']",
            )
            .forEach((el) => {
              el.style.backgroundColor = "#10b981";
              el.style.borderRadius = "8px";
              el.style.width = "40px";
              el.style.height = "40px";
              el.style.display = "flex";
              el.style.alignItems = "center";
              el.style.justifyContent = "center";
              (el.style as any).printColorAdjust = "exact";
              (el.style as any).webkitPrintColorAdjust = "exact";
            });

          // ── Items table ──
          clone.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";
            table.style.fontSize = "10px";

            table
              .querySelectorAll<HTMLElement>("tr.bg-gray-50, thead tr")
              .forEach((row) => {
                row.style.backgroundColor = "#f9fafb";
                (row.style as any).printColorAdjust = "exact";
                (row.style as any).webkitPrintColorAdjust = "exact";
              });

            table.querySelectorAll<HTMLElement>("th").forEach((th) => {
              th.style.fontSize = "8px";
              th.style.fontWeight = "700";
              th.style.color = "#9ca3af";
              th.style.textTransform = "uppercase";
              th.style.letterSpacing = "0.08em";
              th.style.padding = "8px 10px";
              th.style.backgroundColor = "#f9fafb";
              th.style.borderBottom = "1px solid #f3f4f6";
              (th.style as any).printColorAdjust = "exact";
              (th.style as any).webkitPrintColorAdjust = "exact";
            });

            table.querySelectorAll<HTMLTableCellElement>("td").forEach((td) => {
              td.style.padding = "9px 10px";
              td.style.fontSize = "10px";
              td.style.color = "#374151";
              td.style.borderBottom = "1px solid #f9fafb";

              // Last column (totals) — bold
              const row = td.parentElement;
              if (row && td.cellIndex === row.children.length - 1) {
                td.style.fontWeight = "600";
                td.style.color = "#111827";
              }
            });
          });

          // ── Totals block ──
          clone.querySelectorAll<HTMLElement>(".border-t").forEach((el) => {
            el.style.borderTop = "1px solid #e5e7eb";
          });

          // ── Notes block ──
          clone
            .querySelectorAll<HTMLElement>("[class*='bg-amber-50']")
            .forEach((el) => {
              el.style.backgroundColor = "#fffbeb";
              el.style.border = "1px solid #fde68a";
              el.style.borderRadius = "10px";
              el.style.padding = "12px 14px";
              (el.style as any).printColorAdjust = "exact";
              (el.style as any).webkitPrintColorAdjust = "exact";
            });

          // ── Background colours ──
          clone
            .querySelectorAll<HTMLElement>("[class*='bg-gray-50']")
            .forEach((el) => {
              el.style.backgroundColor = "#f9fafb";
              (el.style as any).printColorAdjust = "exact";
              (el.style as any).webkitPrintColorAdjust = "exact";
            });

          // ── Separators ──
          clone
            .querySelectorAll<HTMLElement>(
              "[role='none'], [data-orientation='horizontal']",
            )
            .forEach((el) => {
              el.style.height = "1px";
              el.style.backgroundColor = "#e5e7eb";
              el.style.border = "none";
              el.style.margin = "0";
            });
        },
      });

      // ── 4. Restore original styles ──────────────────────────────────────
      Object.assign(el.style, saved);

      // ── 5. Build PDF (A4, tight margins) ──────────────────────────────
      const A4_W_MM = 210;
      const A4_H_MM = 297;
      const MARGIN_MM = 8;
      const printW = A4_W_MM - MARGIN_MM * 2;
      const imgH = (canvas.height * printW) / canvas.width;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      if (imgH <= A4_H_MM - MARGIN_MM * 2) {
        // ── Single page ──
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.97),
          "JPEG",
          MARGIN_MM,
          MARGIN_MM,
          printW,
          imgH,
          undefined,
          "FAST",
        );
      } else {
        // ── Multi-page ──
        const pageH = A4_H_MM - MARGIN_MM * 2;
        const totalPages = Math.ceil(imgH / pageH);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = (page * pageH * canvas.height) / imgH;
          const srcH = Math.min(
            (pageH * canvas.height) / imgH,
            canvas.height - srcY,
          );

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              srcY,
              canvas.width,
              srcH,
              0,
              0,
              canvas.width,
              srcH,
            );
            const sliceH = (srcH * printW) / canvas.width;
            pdf.addImage(
              sliceCanvas.toDataURL("image/jpeg", 0.97),
              "JPEG",
              MARGIN_MM,
              MARGIN_MM,
              printW,
              sliceH,
              undefined,
              "FAST",
            );
          }
        }
      }

      pdf.save(`proforma-${proformaNumber}.pdf`);
    } catch (err) {
      console.error("ProformaDownloadButton error:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [proformaNumber]);

  useEffect(() => {
    if (autoDownload) handleDownload();
  }, [autoDownload, handleDownload]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={
        className ??
        "flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download PDF
        </>
      )}
    </button>
  );
};

export default ProformaDownloadButton;
