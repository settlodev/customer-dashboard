"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ProformaDownloadButtonProps {
  proformaNumber: string;
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
      await new Promise((r) => setTimeout(r, 150));
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
        scale: 3, // higher DPI → sharper print output
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
        onclone: (_doc, clone) => {
          // ── Base reset ──────────────────────────────────────────────────
          Object.assign(clone.style, {
            width: "794px",
            maxWidth: "794px",
            margin: "0",
            padding: "0",
            transform: "none",
            position: "relative",
            backgroundColor: "#ffffff",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#111827",
          });

          // Make every element fully visible and honour color-adjust
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";
          });

          // ── PROFORMA INVOICE large heading ──────────────────────────────
          // The h2 that contains "PROFORMA INVOICE" — keep it big & colored
          clone.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            if (h.textContent?.toUpperCase().includes("PROFORMA INVOICE")) {
              h.style.fontSize = "28px";
              h.style.fontWeight = "300";
              h.style.letterSpacing = "0.05em";
              h.style.color = "#EB7F44";
              h.style.marginBottom = "8px";
            }
          });

          // ── Table header rows (orange background) ──────────────────────
          // Find thead > tr elements and any tr that had a style backgroundColor
          // matching our PRIMARY color and restore it strongly.
          clone.querySelectorAll<HTMLElement>("thead tr").forEach((tr) => {
            tr.style.backgroundColor = "#EB7F44";
            (tr.style as any).printColorAdjust = "exact";
            (tr.style as any).webkitPrintColorAdjust = "exact";
            tr.querySelectorAll<HTMLElement>("th").forEach((th) => {
              th.style.backgroundColor = "#EB7F44";
              th.style.color = "#ffffff";
              th.style.fontWeight = "700";
              th.style.fontSize = "11px";
              th.style.textTransform = "uppercase";
              th.style.letterSpacing = "0.06em";
              th.style.padding = "10px 14px";
              (th.style as any).printColorAdjust = "exact";
              (th.style as any).webkitPrintColorAdjust = "exact";
            });
          });

          // ── Zebra rows ──────────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
            if (i % 2 !== 0) {
              tr.style.backgroundColor = "#F5F5F0"; // slightly deeper than SECONDARY
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
            }
          });

          // ── Table cells ─────────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("td").forEach((td) => {
            td.style.padding = "10px 14px";
            td.style.fontSize = "11px";
            td.style.color = "#1f2937"; // near-black, not gray
            td.style.borderBottom = "1px solid #D9D9D4";
          });

          // Last column (amount) — extra bold
          clone.querySelectorAll<HTMLElement>("tbody tr").forEach((tr) => {
            const cells = tr.querySelectorAll<HTMLElement>("td");
            if (cells.length > 0) {
              const last = cells[cells.length - 1];
              last.style.fontWeight = "700";
              last.style.color = "#111827";
            }
          });

          // ── Totals block rows ───────────────────────────────────────────
          // Make all text in the totals section darker and heavier
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.fontSize = "12px";
                s.style.color = "#1f2937";
              });
            });

          // Grand total row — strong highlight
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between.font-bold")
            .forEach((row) => {
              row.style.backgroundColor = "#fde8d8";
              row.style.borderRadius = "6px";
              row.style.padding = "10px 12px";
              (row.style as any).printColorAdjust = "exact";
              (row.style as any).webkitPrintColorAdjust = "exact";
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.fontSize = "14px";
                s.style.fontWeight = "800";
                s.style.color = "#EB7F44";
              });
            });

          // VAT line — green, readable
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              const text = row.textContent ?? "";
              if (text.includes("VAT") && text.includes("%")) {
                row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                  s.style.color = "#047857"; // emerald-800 — dark enough to print
                  s.style.fontWeight = "600";
                  s.style.fontSize = "12px";
                });
              }
            });

          // Discount line — red, readable
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              const text = row.textContent ?? "";
              if (text.includes("Discount")) {
                row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                  s.style.color = "#b91c1c"; // red-700 — dark enough to print
                  s.style.fontWeight = "600";
                  s.style.fontSize = "12px";
                });
              }
            });

          // ── Business name / address text ────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p, span").forEach((node) => {
            // Don't touch nodes we've already explicitly styled above
            if (
              node.closest("thead") ||
              node.closest(".flex.justify-between.font-bold")
            )
              return;
            // Upgrade any light-gray text to something that prints clearly
            const computed = node.style.color;
            if (!computed || computed === "" || computed === "inherit") return;
            if (
              computed.includes("156") || // gray-400 rgb(156,163,175)
              computed.includes("107") || // gray-500 rgb(107,114,128)
              node.classList.contains("text-gray-400") ||
              node.classList.contains("text-gray-500")
            ) {
              node.style.color = "#4b5563"; // gray-600 — legible when printed
            }
          });

          // ── Separator lines ─────────────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              "[role='none'], [data-orientation='horizontal']",
            )
            .forEach((sep) => {
              sep.style.height = "1px";
              sep.style.backgroundColor = "#D1D5DB";
              sep.style.border = "none";
              sep.style.margin = "0";
              (sep.style as any).printColorAdjust = "exact";
              (sep.style as any).webkitPrintColorAdjust = "exact";
            });

          // Inline divider divs (mx-8 h-px style dividers in the invoice)
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px") {
              div.style.backgroundColor = "#D1D5DB";
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });

          // ── VAT note line at bottom of totals ───────────────────────────
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            if (
              p.textContent?.includes("VAT of") &&
              p.textContent?.includes("included")
            ) {
              p.style.fontSize = "10px";
              p.style.color = "#374151";
              p.style.fontStyle = "italic";
            }
          });

          // ── Meta table (Estimate Number / Date etc.) ────────────────────
          clone
            .querySelectorAll<HTMLElement>("table td, table th")
            .forEach((cell) => {
              if (!(cell as HTMLTableCellElement).closest?.("thead")) {
                cell.style.fontSize = "11px";
                cell.style.color = "#1f2937";
              }
            });

          // ── Bill-To section ─────────────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              "[class*='text-xs'][class*='uppercase'][class*='tracking-widest']",
            )
            .forEach((label) => {
              label.style.fontSize = "9px";
              label.style.color = "#6b7280";
              label.style.letterSpacing = "0.12em";
              label.style.textTransform = "uppercase";
            });

          // ── Footer text ─────────────────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              "[class*='text-center'] p, [class*='text-center'] span",
            )
            .forEach((node) => {
              node.style.fontSize = "10px";
              node.style.color = "#6b7280";
            });
        },
      });

      // ── 4. Restore original styles ──────────────────────────────────────
      Object.assign(el.style, saved);

      // ── 5. Build PDF (A4, tight margins) ──────────────────────────────
      const A4_W_MM = 210;
      const A4_H_MM = 297;
      const MARGIN_MM = 10;
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
          canvas.toDataURL("image/jpeg", 1.0), // max quality
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
              sliceCanvas.toDataURL("image/jpeg", 1.0),
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
