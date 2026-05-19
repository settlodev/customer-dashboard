"use client";

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { StockReceipt } from "@/types/stock-intake-receipt/type";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";
const PRIMARY_BG = "#fde8d8";
const SECONDARY = "#EAEAE5";
const ROW_ALT = "#F0F0EC";

interface EnhancedStockPurchaseItem {
  id?: string;
  stock: string;
  stockName: string;
  stockVariant: string;
  stockVariantName: string;
  quantityReceived: number;
  bonusQuantity?: number;
  totalCost: number;
  previousCostPerItem: number;
  lastCostPerItem?: number;
  sellingPrice?: number;
  margin?: number;
  code?: string;
}

interface GRNDownloadButtonProps {
  receiptData: StockReceipt;
  items: EnhancedStockPurchaseItem[];
  totalQuantityReceived: number;
  totalValue: number;
}

export function GRNDownloadButton({ receiptData }: GRNDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const generatePDF = useCallback(async () => {
    const el = document.getElementById("grn-content");
    if (!el) return;

    setIsDownloading(true);

    try {
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
        scale: 3, // 3× DPI — sharper print output
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
            color: "#111827",
          });

          // Fully visible + colour-adjust on every node
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";
          });

          // ── Show desktop table, hide mobile cards ─────────────────
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

          // ── Accent bars (top / bottom orange strips) ──────────────
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const s = div.getAttribute("style") ?? "";
            if (
              (s.includes("EB7F44") || s.includes("eb7f44")) &&
              (div.style.height === "6px" ||
                div.style.height === "4px" ||
                div.style.height === "8px" ||
                div.style.height === "5px")
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

          // ── GRN heading ───────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            const txt = h.textContent?.trim().toUpperCase() ?? "";
            if (
              txt.includes("GOODS") ||
              txt.includes("RECEIPT") ||
              txt.includes("GRN")
            ) {
              h.style.setProperty("color", PRIMARY_DARK, "important");
              h.style.setProperty("font-size", "28px", "important");
              h.style.setProperty("font-weight", "300", "important");
              h.style.setProperty("letter-spacing", "0.05em", "important");
            }
          });

          // ── Business name h1 ─────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("h1").forEach((h) => {
            h.style.setProperty("color", "#111827", "important");
            h.style.setProperty("font-size", "16px", "important");
            h.style.setProperty("font-weight", "700", "important");
          });

          // ── Items table header ────────────────────────────────────
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
            th.style.setProperty("padding", "10px 12px", "important");
            th.style.setProperty("text-transform", "uppercase", "important");
            th.style.setProperty("letter-spacing", "0.06em", "important");
            (th.style as any).printColorAdjust = "exact";
            (th.style as any).webkitPrintColorAdjust = "exact";
          });

          // ── Items table — zebra rows + cells ─────────────────────
          clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
            if (!table.querySelector("thead")) return; // skip meta tables

            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
              const bg = i % 2 === 0 ? "#ffffff" : ROW_ALT;
              tr.style.setProperty("background-color", bg, "important");
              tr.style.setProperty(
                "border-bottom",
                "1px solid #C8C8C2",
                "important",
              );
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
            });

            // Last column per row — bold & dark
            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr) => {
              const cells = tr.querySelectorAll<HTMLElement>("td");
              cells.forEach((td, ci) => {
                td.style.setProperty("font-size", "10px", "important");
                td.style.setProperty("padding", "10px 12px", "important");
                td.style.setProperty("color", "#1f2937", "important");
                if (ci === cells.length - 1) {
                  td.style.setProperty("font-weight", "700", "important");
                  td.style.setProperty("color", "#111827", "important");
                }
              });
            });

            // tfoot / total row
            table.querySelectorAll<HTMLElement>("tfoot tr").forEach((tr) => {
              tr.style.setProperty("background-color", PRIMARY_BG, "important");
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
              tr.querySelectorAll<HTMLElement>("td").forEach((td) => {
                td.style.setProperty("font-weight", "700", "important");
                td.style.setProperty("color", PRIMARY_DARK, "important");
                td.style.setProperty("font-size", "12px", "important");
              });
            });
          });

          // ── Meta table (no thead) — clean, no borders ────────────
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
              td.style.setProperty("color", "#1f2937", "important");
            });
          });

          // ── Summary / total boxes (orange tint) ───────────────────
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
              (node.style as any).printColorAdjust = "exact";
              (node.style as any).webkitPrintColorAdjust = "exact";
              node
                .querySelectorAll<HTMLElement>("span, p, td, div")
                .forEach((child) => {
                  if (
                    child.style.color === PRIMARY ||
                    window
                      .getComputedStyle(child)
                      .color.includes("235, 127, 68")
                  ) {
                    child.style.setProperty("color", PRIMARY_DARK, "important");
                    child.style.setProperty("font-weight", "700", "important");
                  }
                });
            });

          // ── All computed orange text → PRIMARY_DARK ───────────────
          clone
            .querySelectorAll<HTMLElement>("span, div, p, td, th, h1, h2, h3")
            .forEach((node) => {
              const cs = window.getComputedStyle(node);
              if (cs.color.includes("235, 127, 68")) {
                node.style.setProperty("color", PRIMARY_DARK, "important");
              }
              if (cs.backgroundColor.includes("235, 127, 68")) {
                node.style.setProperty(
                  "background-color",
                  PRIMARY_DARK,
                  "important",
                );
                (node.style as any).printColorAdjust = "exact";
                (node.style as any).webkitPrintColorAdjust = "exact";
              }
            });

          // ── Light-gray text → minimum gray-600 for print ─────────
          clone
            .querySelectorAll<HTMLElement>("p, span, td, li")
            .forEach((node) => {
              if (node.closest("thead")) return;
              const c = window.getComputedStyle(node).color;
              // gray-400: rgb(156,163,175)  gray-500: rgb(107,114,128)
              if (c.includes("156, 163") || c.includes("107, 114")) {
                node.style.setProperty("color", "#4b5563", "important"); // gray-600
              }
            });

          // ── Signature lines ───────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="border-bottom: 2px solid"]',
            )
            .forEach((node) => {
              node.style.setProperty(
                "border-bottom",
                "2px solid #6b7280",
                "important",
              );
            });

          // ── Approval / VAT bordered tables — keep SECONDARY borders
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="EAEAE5"], [style*="eaeae5"]',
            )
            .forEach((node) => {
              const s = node.getAttribute("style") ?? "";
              if (s.includes("border")) {
                node.style.setProperty("border-color", "#C8C8C2", "important");
              }
            });

          // ── Separator / divider lines ─────────────────────────────
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px") {
              div.style.setProperty("background-color", "#D1D5DB", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });

          // ── Typography ────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p, span, li").forEach((node) => {
            node.style.fontFamily = "system-ui, -apple-system, sans-serif";
            node.style.lineHeight = "1.5";
            if (!node.style.fontSize) node.style.fontSize = "10px";
          });
          clone.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
            h.style.fontFamily = "system-ui, -apple-system, sans-serif";
            h.style.lineHeight = "1.2";
          });

          // ── Footer text ───────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent ?? "";
            if (
              txt.includes("Thank you") ||
              txt.includes("generated") ||
              txt.includes("Powered by") ||
              txt.includes("do not alter")
            ) {
              p.style.setProperty("font-size", "9px", "important");
              p.style.setProperty("color", "#4b5563", "important");
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

      const filename = `GRN-${receiptData.receiptNumber}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("GRN PDF generation failed:", error);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [receiptData]);

  return (
    <button
      onClick={generatePDF}
      disabled={isDownloading}
      className="flex justify-center items-center gap-2 lg:w-[90%] w-full px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      {isDownloading ? "Generating…" : "Download GRN"}
    </button>
  );
}
