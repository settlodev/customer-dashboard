"use client";

import React, { useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";
const PRIMARY_BG = "#fde8d8";
const ROW_ALT = "#F0F0EC";

interface DeliveryNoteDownloadButtonProps {
  orderNumber: string;
  isDownloadable?: boolean;
  title: string;
  fontSize?: {
    header?: string;
    body?: string;
    footer?: string;
  };
}

const DeliveryNoteDownloadButton = ({
  orderNumber,
  isDownloadable,
  title,
  fontSize = { header: "14px", body: "10px", footer: "8px" },
}: DeliveryNoteDownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const el = document.getElementById("delivery-note-content");
    if (!el) return;

    const btn = document.querySelector(
      "[data-delivery-download-button]",
    ) as HTMLButtonElement | null;

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating…";
      }

      // ── 1. Snapshot + normalise layout ─────────────────────────────
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
      Object.assign(el.style, {
        width: "794px",
        maxWidth: "794px",
        margin: "0",
        padding: "0",
        transform: "none",
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: "0",
        boxShadow: "none",
      });

      await new Promise((r) => setTimeout(r, 150));
      await Promise.all(
        Array.from(el.querySelectorAll("img")).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((r) => {
            img.onload = r;
            img.onerror = r;
            setTimeout(r, 5000);
          });
        }),
      );

      // ── 2. Capture ─────────────────────────────────────────────────
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
          // ── Base reset ────────────────────────────────────────────
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

          // ── STEP 1: Nuclear black override ──────────────────────────
          // Force ALL text to #000000 and ALL borders to black first.
          // Selective brand colors are re-applied in subsequent steps.
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";

            // All text → black
            node.style.color = "#000000";

            // All borders → black (inline style overrides)
            if (node.style.borderColor || node.style.border) {
              node.style.borderColor = "#000000";
            }

            // Borders from computed styles (catches Tailwind utility classes)
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

          // ── STEP 2: Show desktop table, hide mobile cards ────────────
          clone
            .querySelectorAll<HTMLElement>(".lg\\:hidden")
            .forEach((node) => {
              node.style.setProperty("display", "none", "important");
            });
          clone
            .querySelectorAll<HTMLElement>(
              ".hidden.lg\\:block, .hidden.lg\\:table",
            )
            .forEach((node) => {
              node.style.setProperty("display", "block", "important");
            });

          // ── STEP 3: Accent bars (top/bottom orange strips) ───────────
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const s = div.getAttribute("style") ?? "";
            if (
              (s.includes("EB7F44") || s.includes("eb7f44")) &&
              (div.style.height === "6px" ||
                div.style.height === "4px" ||
                div.style.height === "8px")
            ) {
              div.style.setProperty(
                "background-color",
                PRIMARY_DARK,
                "important",
              );
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });

          // ── STEP 4: DELIVERY NOTE heading — brand orange ─────────────
          clone.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            const txt = h.textContent?.trim().toUpperCase() ?? "";
            if (txt.includes("DELIVERY")) {
              h.style.setProperty("color", PRIMARY_DARK, "important");
              h.style.setProperty("font-size", "32px", "important");
              h.style.setProperty("font-weight", "300", "important");
              h.style.setProperty("letter-spacing", "0.05em", "important");
            }
          });

          // ── STEP 5: Business name h1 — black bold ────────────────────
          clone.querySelectorAll<HTMLElement>("h1").forEach((h) => {
            h.style.setProperty("color", "#000000", "important");
            h.style.setProperty("font-size", "16px", "important");
            h.style.setProperty("font-weight", "700", "important");
          });

          // ── STEP 6: Items table header — orange bg, white text ───────
          clone.querySelectorAll<HTMLElement>("thead tr").forEach((tr) => {
            tr.style.setProperty("background-color", PRIMARY_DARK, "important");
            (tr.style as any).printColorAdjust = "exact";
            (tr.style as any).webkitPrintColorAdjust = "exact";
          });
          clone.querySelectorAll<HTMLElement>("thead th").forEach((th) => {
            th.style.setProperty("background-color", PRIMARY_DARK, "important");
            th.style.setProperty("color", "#ffffff", "important");
            th.style.setProperty("font-size", "10px", "important");
            th.style.setProperty("font-weight", "700", "important");
            th.style.setProperty("padding", "10px 14px", "important");
            th.style.setProperty("text-transform", "uppercase", "important");
            th.style.setProperty("letter-spacing", "0.06em", "important");
            th.style.setProperty("border", "none", "important");
            (th.style as any).printColorAdjust = "exact";
            (th.style as any).webkitPrintColorAdjust = "exact";
          });

          // ── STEP 7: Items table — zebra rows, black borders & text ───
          clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
            if (!table.querySelector("thead")) return;

            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
              const bg = i % 2 === 0 ? "#ffffff" : ROW_ALT;
              tr.style.setProperty("background-color", bg, "important");
              tr.style.setProperty(
                "border-bottom",
                "1px solid #000000",
                "important",
              );
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
            });

            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr) => {
              const cells = tr.querySelectorAll<HTMLElement>("td");
              cells.forEach((td, ci) => {
                td.style.setProperty(
                  "font-size",
                  fontSize.body ?? "10px",
                  "important",
                );
                td.style.setProperty("padding", "10px 14px", "important");
                td.style.setProperty("color", "#000000", "important");
                td.style.setProperty(
                  "border-bottom",
                  "1px solid #000000",
                  "important",
                );
                if (ci === cells.length - 1) {
                  td.style.setProperty("font-weight", "700", "important");
                }
              });
            });

            // tfoot / total row — orange tint bg, orange-dark text
            table.querySelectorAll<HTMLElement>("tfoot tr").forEach((tr) => {
              tr.style.setProperty("background-color", PRIMARY_BG, "important");
              tr.style.setProperty("border", "1px solid #000000", "important");
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
              tr.querySelectorAll<HTMLElement>("td").forEach((td) => {
                td.style.setProperty("font-weight", "700", "important");
                td.style.setProperty("color", PRIMARY_DARK, "important");
                td.style.setProperty("font-size", "12px", "important");
                td.style.setProperty("border", "none", "important");
              });
            });
          });

          // ── STEP 8: Meta table (no thead) — no borders, black text ───
          clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
            if (table.querySelector("thead")) return;
            table.querySelectorAll<HTMLElement>("tr").forEach((tr) => {
              tr.style.setProperty(
                "background-color",
                "transparent",
                "important",
              );
              tr.style.setProperty("border", "none", "important");
            });
            table.querySelectorAll<HTMLElement>("td").forEach((td) => {
              td.style.setProperty(
                "background-color",
                "transparent",
                "important",
              );
              td.style.setProperty("border", "none", "important");
              td.style.setProperty("font-size", "11px", "important");
              td.style.setProperty("padding", "5px 8px", "important");
              td.style.setProperty("color", "#000000", "important");
            });
          });

          // ── STEP 9: Highlighted rows / boxes (orange tint) ───────────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="fde8d8"], [style*="F2942233"], [style*="f2942233"]',
            )
            .forEach((node) => {
              node.style.setProperty(
                "background-color",
                PRIMARY_BG,
                "important",
              );
              node.style.setProperty(
                "border",
                "1px solid #000000",
                "important",
              );
              (node.style as any).printColorAdjust = "exact";
              (node.style as any).webkitPrintColorAdjust = "exact";
              node
                .querySelectorAll<HTMLElement>("span, p, td")
                .forEach((child) => {
                  child.style.setProperty("color", PRIMARY_DARK, "important");
                  child.style.setProperty("font-weight", "700", "important");
                });
            });

          // ── STEP 10: Signature lines — solid black border ─────────────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="border-bottom: 2px solid"]',
            )
            .forEach((node) => {
              node.style.setProperty(
                "border-bottom",
                "2px solid #000000",
                "important",
              );
            });

          // ── STEP 11: Dashed fill-in spans — black dashed ─────────────
          clone
            .querySelectorAll<HTMLElement>('[style*="dashed"]')
            .forEach((node) => {
              node.style.setProperty(
                "border-bottom",
                "1.5px dashed #000000",
                "important",
              );
            });

          // ── STEP 12: Separator / divider lines — solid black ─────────
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px" || div.classList.contains("h-px")) {
              div.style.setProperty("background-color", "#000000", "important");
              div.style.setProperty("border", "none", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });
          clone
            .querySelectorAll<HTMLElement>(
              '[role="none"], [data-orientation="horizontal"]',
            )
            .forEach((sep) => {
              sep.style.setProperty("height", "1px", "important");
              sep.style.setProperty("background-color", "#000000", "important");
              sep.style.setProperty("border", "none", "important");
              (sep.style as any).printColorAdjust = "exact";
              (sep.style as any).webkitPrintColorAdjust = "exact";
            });

          // ── STEP 13: Section labels (BILL TO / DELIVER TO / SHIP TO) ─
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent?.trim().toUpperCase() ?? "";
            if (
              txt === "BILL TO" ||
              txt === "DELIVER TO" ||
              txt === "SHIP TO"
            ) {
              p.style.setProperty("font-size", "9px", "important");
              p.style.setProperty("color", "#000000", "important");
              p.style.setProperty("font-weight", "700", "important");
              p.style.setProperty("letter-spacing", "0.12em", "important");
              p.style.setProperty("text-transform", "uppercase", "important");
            }
          });

          // ── STEP 14: Typography defaults ─────────────────────────────
          clone.querySelectorAll<HTMLElement>("p, span, li").forEach((node) => {
            node.style.fontFamily = "system-ui, -apple-system, sans-serif";
            node.style.lineHeight = "1.5";
            if (!node.style.fontSize)
              node.style.fontSize = fontSize.body ?? "10px";
          });
          clone.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
            h.style.fontFamily = "system-ui, -apple-system, sans-serif";
            h.style.lineHeight = "1.2";
          });

          // ── STEP 15: Footer text — black ─────────────────────────────
          clone.querySelectorAll<HTMLElement>("p, span").forEach((node) => {
            const txt = node.textContent ?? "";
            if (
              txt.includes("Thank you") ||
              txt.includes("Powered by") ||
              txt.includes("Dispatched by")
            ) {
              node.style.setProperty(
                "font-size",
                fontSize.footer ?? "9px",
                "important",
              );
              node.style.setProperty("color", "#000000", "important");
            }
          });

          // ── STEP 16: Hide "Generated on" and "Confirmed" lines ───────
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
                node.style.setProperty("display", "none", "important");
              }
            });
        },
      });

      // ── 3. Restore original styles ──────────────────────────────────
      Object.assign(el.style, saved);

      // ── 4. Build PDF ────────────────────────────────────────────────
      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;
      const printW = A4_W - MARGIN * 2;
      const contentH = (canvas.height * printW) / canvas.width;
      const pageH = A4_H - MARGIN * 2;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      if (contentH <= pageH) {
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1.0),
          "JPEG",
          MARGIN,
          MARGIN,
          printW,
          contentH,
          undefined,
          "FAST",
        );
      } else {
        const totalPages = Math.ceil(contentH / pageH);
        const pageHeightPx = (pageH * canvas.width) / printW;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = page * pageHeightPx;
          const srcH = Math.min(pageHeightPx, canvas.height - srcY);

          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = srcH;
          const ctx = slice.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
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
            slice.toDataURL("image/jpeg", 1.0),
            "JPEG",
            MARGIN,
            MARGIN,
            printW,
            sliceH,
            undefined,
            "FAST",
          );
        }
      }

      pdf.save(`delivery-note-${orderNumber}.pdf`);
    } catch (err) {
      console.error("Delivery note PDF generation failed:", err);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${title}`;
      }
    }
  }, [orderNumber, fontSize, title]);

  useEffect(() => {
    if (isDownloadable) handleDownload();
  }, [isDownloadable, handleDownload]);

  return (
    <button
      data-delivery-download-button
      onClick={handleDownload}
      className="flex justify-center items-center gap-2 lg:w-[50%] w-full px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: PRIMARY }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
          PRIMARY_DARK)
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY)
      }
    >
      <Download size={16} />
      {title}
    </button>
  );
};

export default DeliveryNoteDownloadButton;
