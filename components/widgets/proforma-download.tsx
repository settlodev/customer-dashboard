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
        scale: 3,
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
            color: "#000000",
          });

          // ── STEP 1: Force ALL text nodes to black by default ────────────
          // This is the nuclear option — override every element's color to
          // pure black first, then selectively re-apply brand colors below.
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";

            // Force ALL text to black unless we override it below
            node.style.color = "#000000";

            // Force ALL borders to black
            if (node.style.borderColor || node.style.border) {
              node.style.borderColor = "#000000";
            }
            // Force border-bottom used in table cells
            const computed = window.getComputedStyle(node);
            if (computed.borderBottomWidth !== "0px") {
              node.style.borderBottom = `${computed.borderBottomWidth} solid #000000`;
            }
            if (computed.borderTopWidth !== "0px") {
              node.style.borderTop = `${computed.borderTopWidth} solid #000000`;
            }
            if (computed.borderLeftWidth !== "0px") {
              node.style.borderLeft = `${computed.borderLeftWidth} solid #000000`;
            }
            if (computed.borderRightWidth !== "0px") {
              node.style.borderRight = `${computed.borderRightWidth} solid #000000`;
            }
          });

          // ── STEP 2: PROFORMA INVOICE heading — brand orange ─────────────
          clone.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            if (h.textContent?.toUpperCase().includes("PROFORMA INVOICE")) {
              h.style.fontSize = "28px";
              h.style.fontWeight = "300";
              h.style.letterSpacing = "0.05em";
              h.style.color = "#EB7F44";
              h.style.marginBottom = "8px";
            }
          });

          // ── STEP 3: Table header rows (orange background, white text) ───
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
              th.style.border = "none";
              (th.style as any).printColorAdjust = "exact";
              (th.style as any).webkitPrintColorAdjust = "exact";
            });
          });

          // ── STEP 4: Zebra rows ──────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
            if (i % 2 !== 0) {
              tr.style.backgroundColor = "#EEEEEE";
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
            } else {
              tr.style.backgroundColor = "#ffffff";
            }
          });

          // ── STEP 5: Table cells — black text, visible borders ───────────
          clone.querySelectorAll<HTMLElement>("td").forEach((td) => {
            td.style.padding = "10px 14px";
            td.style.fontSize = "11px";
            td.style.color = "#000000";
            td.style.borderBottom = "1px solid #000000";
          });

          // Last column (amount) — bold black
          clone.querySelectorAll<HTMLElement>("tbody tr").forEach((tr) => {
            const cells = tr.querySelectorAll<HTMLElement>("td");
            if (cells.length > 0) {
              const last = cells[cells.length - 1];
              last.style.fontWeight = "700";
              last.style.color = "#000000";
            }
          });

          // ── STEP 6: Totals block ────────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.fontSize = "12px";
                s.style.color = "#000000";
              });
            });

          // Grand total row — highlight with orange tint, orange bold text
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between.font-bold")
            .forEach((row) => {
              row.style.backgroundColor = "#fde8d8";
              row.style.borderRadius = "6px";
              row.style.padding = "10px 12px";
              row.style.border = "1px solid #000000";
              (row.style as any).printColorAdjust = "exact";
              (row.style as any).webkitPrintColorAdjust = "exact";
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.fontSize = "14px";
                s.style.fontWeight = "800";
                s.style.color = "#EB7F44";
              });
            });

          // VAT line — dark green
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              const text = row.textContent ?? "";
              if (text.includes("VAT") && text.includes("%")) {
                row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                  s.style.color = "#145a32";
                  s.style.fontWeight = "600";
                  s.style.fontSize = "12px";
                });
              }
            });

          // Discount line — dark red
          clone
            .querySelectorAll<HTMLElement>(".flex.justify-between")
            .forEach((row) => {
              const text = row.textContent ?? "";
              if (text.includes("Discount")) {
                row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                  s.style.color = "#7b241c";
                  s.style.fontWeight = "600";
                  s.style.fontSize = "12px";
                });
              }
            });

          // ── STEP 7: Separator / divider lines — solid black ─────────────
          clone
            .querySelectorAll<HTMLElement>(
              "[role='none'], [data-orientation='horizontal']",
            )
            .forEach((sep) => {
              sep.style.height = "1px";
              sep.style.backgroundColor = "#000000";
              sep.style.border = "none";
              sep.style.margin = "0";
              (sep.style as any).printColorAdjust = "exact";
              (sep.style as any).webkitPrintColorAdjust = "exact";
            });

          // Inline divider divs (h-px style)
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px" || div.classList.contains("h-px")) {
              div.style.backgroundColor = "#000000";
              div.style.border = "none";
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });

          // ── STEP 8: Meta table rows (Estimate Number, Date etc.) ─────────
          // These often have alternating gray bg — keep bg but force text black
          clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
            // Skip the items table (has thead)
            if (table.querySelector("thead")) return;
            table.querySelectorAll<HTMLElement>("tr").forEach((tr, i) => {
              tr.style.backgroundColor = i % 2 === 0 ? "#ffffff" : "#f3f3f3";
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
              tr.querySelectorAll<HTMLElement>("td, th").forEach((cell) => {
                cell.style.color = "#000000";
                cell.style.fontSize = "11px";
                cell.style.fontWeight = cell.tagName === "TH" ? "700" : "400";
                cell.style.border = "1px solid #000000";
                (cell.style as any).printColorAdjust = "exact";
                (cell.style as any).webkitPrintColorAdjust = "exact";
              });
            });
          });

          // ── STEP 9: "BILL TO" label and all small uppercase labels ───────
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            // Target small tracking-widest uppercase labels
            if (
              node.classList.contains("tracking-widest") ||
              node.classList.contains("uppercase") ||
              (node.style.textTransform === "uppercase" &&
                parseFloat(node.style.fontSize || "16") <= 10)
            ) {
              node.style.color = "#000000";
              node.style.fontWeight = "700";
            }
          });

          // ── STEP 10: Business name / header block (right side) ───────────
          clone
            .querySelectorAll<HTMLElement>("h1, h3, h4, h5, h6")
            .forEach((h) => {
              h.style.color = "#000000";
              h.style.fontWeight = "700";
            });

          // ── STEP 11: Footer text — black ────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              "[class*='text-center'] p, [class*='text-center'] span, footer p, footer span",
            )
            .forEach((node) => {
              node.style.fontSize = "10px";
              node.style.color = "#000000";
            });

          // ── STEP 12: VAT note line ───────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            if (
              p.textContent?.includes("VAT of") &&
              p.textContent?.includes("included")
            ) {
              p.style.fontSize = "10px";
              p.style.color = "#000000";
              p.style.fontStyle = "italic";
            }
          });

          // ── STEP 13: Hide "Generated on" and "Confirmed by customer" ────
          // Walk every element; if its *own* text (trimmed) starts with one
          // of these phrases, hide the entire node so it won't appear in PDF.
          clone
            .querySelectorAll<HTMLElement>("p, span, div, li")
            .forEach((node) => {
              const ownText = (node.textContent ?? "").trim();
              if (
                ownText.startsWith("Generated on") ||
                ownText.includes("Confirmed by customer") ||
                ownText.includes("✓ Confirmed") ||
                ownText.includes("√ Confirmed")
              ) {
                node.style.display = "none";
              }
            });

          // ── STEP 14: Remove any remaining background from outlined boxes ─
          // Ensure meta info box borders are black
          clone
            .querySelectorAll<HTMLElement>("div, section")
            .forEach((node) => {
              const border = node.style.border;
              if (border && border !== "none" && border !== "") {
                node.style.border = border.replace(
                  /rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-z]+-[a-z]+/g,
                  (match) => {
                    // Keep "none", keep width/style, replace color with black
                    if (
                      match === "none" ||
                      /^\d/.test(match) ||
                      ["solid", "dashed", "dotted", "double"].includes(match)
                    )
                      return match;
                    return "#000000";
                  },
                );
              }
              // Also catch inline border-color
              if (node.style.borderColor) {
                node.style.borderColor = "#000000";
              }
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
          canvas.toDataURL("image/jpeg", 1.0),
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
