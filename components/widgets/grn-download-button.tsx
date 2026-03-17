"use client";

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { StockReceipt } from "@/types/stock-intake-receipt/type";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

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

export function GRNDownloadButton({
  receiptData,
  totalValue,
}: GRNDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const generatePDF = useCallback(async () => {
    const el = document.getElementById("grn-content");
    if (!el) return;

    setIsDownloading(true);

    try {
      // ── Snapshot original styles ──────────────────────────────────────
      const originalStyles = {
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        margin: el.style.margin,
        padding: el.style.padding,
        transform: el.style.transform,
        position: el.style.position,
        backgroundColor: el.style.backgroundColor,
      };

      // ── Force A4 layout ───────────────────────────────────────────────
      el.style.width = "794px";
      el.style.maxWidth = "794px";
      el.style.margin = "0";
      el.style.padding = "0";
      el.style.transform = "none";
      el.style.position = "relative";
      el.style.backgroundColor = "#ffffff";

      await new Promise((r) => setTimeout(r, 150));

      // ── Wait for images ───────────────────────────────────────────────
      const images = el.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((r) => {
            img.onload = r;
            img.onerror = r;
            setTimeout(r, 5000);
          });
        }),
      );

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
        onclone: (_doc, clone) => {
          // ── Base reset ──────────────────────────────────────────────
          clone.style.cssText = `
            width: 794px !important;
            max-width: 794px !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            position: relative !important;
            background-color: #ffffff !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            color: #111827 !important;
          `;

          // ── Force print color rendering ─────────────────────────────
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";

            const cs = window.getComputedStyle(node);
            const color = cs.color;
            const bg = cs.backgroundColor;

            if (
              bg &&
              (bg.includes("235, 127, 68") || bg.includes("253, 232, 216"))
            ) {
              node.style.setProperty("background-color", bg, "important");
            }
            if (color && color.includes("235, 127, 68")) {
              node.style.setProperty("color", color, "important");
            }
          });

          // ── Top / bottom accent bars ────────────────────────────────
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const s = div.getAttribute("style") ?? "";
            if (s.includes("EB7F44") || s.includes("eb7f44")) {
              div.style.setProperty("background-color", PRIMARY, "important");
            }
          });

          // ── Tables ─────────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("table").forEach((table) => {
            const hasHeader = table.querySelector("thead") !== null;

            if (hasHeader) {
              // Items table — orange header + zebra rows
              table.querySelectorAll<HTMLElement>("thead tr").forEach((tr) => {
                tr.style.setProperty("background-color", PRIMARY, "important");
              });
              table.querySelectorAll<HTMLElement>("thead th").forEach((th) => {
                th.style.setProperty("background-color", PRIMARY, "important");
                th.style.setProperty("color", "#ffffff", "important");
                th.style.fontSize = "9px";
                th.style.fontWeight = "600";
                th.style.padding = "10px 12px";
                th.style.textTransform = "uppercase";
                th.style.letterSpacing = "0.05em";
              });
              table
                .querySelectorAll<HTMLElement>("tbody tr")
                .forEach((tr, i) => {
                  tr.style.setProperty(
                    "background-color",
                    i % 2 === 0 ? "#ffffff" : "#f5f5f3",
                    "important",
                  );
                  tr.style.setProperty(
                    "border-bottom",
                    `1px solid ${SECONDARY}`,
                    "important",
                  );
                });
              table.querySelectorAll<HTMLElement>("tbody td").forEach((td) => {
                td.style.fontSize = "10px";
                td.style.padding = "10px 12px";
                td.style.color = "#374151";
              });
            } else {
              // Meta table — clean, no borders, no bg
              table.querySelectorAll<HTMLElement>("tr").forEach((tr) => {
                tr.style.setProperty(
                  "background-color",
                  "transparent",
                  "important",
                );
                tr.style.setProperty("border", "none", "important");
                tr.style.setProperty("border-bottom", "none", "important");
              });
              table.querySelectorAll<HTMLElement>("td").forEach((td) => {
                td.style.setProperty(
                  "background-color",
                  "transparent",
                  "important",
                );
                td.style.setProperty("border", "none", "important");
                td.style.setProperty("border-bottom", "none", "important");
                td.style.fontSize = "10px";
                td.style.padding = "5px 8px";
              });
            }
          });

          // ── Orange tint rows (total row, summary box) ───────────────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="fde8d8"], [style*="F2942233"]',
            )
            .forEach((node) => {
              node.style.setProperty(
                "background-color",
                PRIMARY_LIGHT,
                "important",
              );
            });

          // ── Force all computed orange text / bg ─────────────────────
          clone
            .querySelectorAll<HTMLElement>("span, div, p, td, th, h1, h2, h3")
            .forEach((node) => {
              const cs = window.getComputedStyle(node);
              if (cs.color.includes("235, 127, 68")) {
                node.style.setProperty("color", PRIMARY, "important");
              }
              if (cs.backgroundColor.includes("235, 127, 68")) {
                node.style.setProperty(
                  "background-color",
                  PRIMARY,
                  "important",
                );
              }
              if (cs.backgroundColor.includes("253, 232, 216")) {
                node.style.setProperty(
                  "background-color",
                  PRIMARY_LIGHT,
                  "important",
                );
              }
            });

          // ── Signature lines ─────────────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="border-bottom: 2px solid"]',
            )
            .forEach((node) => {
              node.style.setProperty(
                "border-bottom",
                "2px solid #d1d5db",
                "important",
              );
            });

          // ── Hide mobile cards, show desktop table ───────────────────
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

          // ── Typography ──────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p, span, li").forEach((node) => {
            node.style.fontFamily = "system-ui, -apple-system, sans-serif";
            node.style.lineHeight = "1.5";
            if (!node.style.fontSize) node.style.fontSize = "10px";
          });
          clone.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
            h.style.fontFamily = "system-ui, -apple-system, sans-serif";
            h.style.lineHeight = "1.2";
          });

          // ── Footer text ─────────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent ?? "";
            if (
              txt.includes("Thank you") ||
              txt.includes("generated") ||
              txt.includes("Powered by") ||
              txt.includes("do not alter")
            ) {
              if (!p.style.color) p.style.color = "#6b7280";
              p.style.fontSize = "8px";
            }
          });

          // ── Approval / VAT tables — keep their SECONDARY borders ────
          clone
            .querySelectorAll<HTMLElement>(
              '[style*="EAEAE5"], [style*="eaeae5"]',
            )
            .forEach((node) => {
              const s = node.getAttribute("style") ?? "";
              if (s.includes("border")) {
                node.style.setProperty("border-color", SECONDARY, "important");
              }
            });
        },
      });

      // ── Restore original styles ─────────────────────────────────────
      Object.assign(el.style, originalStyles);

      // ── Build PDF ───────────────────────────────────────────────────
      const pdfWidthMm = 210;
      const marginMm = 8;
      const usableWidthMm = pdfWidthMm - marginMm * 2;
      const pdfHeightMm = (canvas.height * usableWidthMm) / canvas.width;
      const pageHeightMm = 297 - marginMm * 2;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      if (pdfHeightMm <= pageHeightMm) {
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1.0),
          "JPEG",
          marginMm,
          marginMm,
          usableWidthMm,
          pdfHeightMm,
          undefined,
          "FAST",
        );
      } else {
        const totalPages = Math.ceil(pdfHeightMm / pageHeightMm);
        const pageHeightPx = (pageHeightMm * canvas.width) / usableWidthMm;

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const srcY = page * pageHeightPx;
          const srcH = Math.min(pageHeightPx, canvas.height - srcY);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcH;
          const ctx = pageCanvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
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

          const sliceHeightMm = (srcH * usableWidthMm) / canvas.width;
          pdf.addImage(
            pageCanvas.toDataURL("image/jpeg", 1.0),
            "JPEG",
            marginMm,
            marginMm,
            usableWidthMm,
            sliceHeightMm,
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
          "#d4703a")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY)
      }
    >
      <Download size={16} />
      {isDownloading ? "Generating..." : "Download GRN"}
    </button>
  );
}
