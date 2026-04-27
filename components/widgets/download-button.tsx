"use client";

import React, { useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadButtonProps {
  orderNumber: string;
  isDownloadable?: boolean;
  title: string;
  isEfd?: boolean;
  fontSize?: {
    header?: string;
    body?: string;
    footer?: string;
  };
}

const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";
const PRIMARY_BG = "#fde8d8";
const ROW_ALT = "#F0F0EC";

const DownloadButton = ({
  orderNumber,
  isDownloadable,
  title,
  isEfd = false,
  fontSize = { header: "14px", body: "10px", footer: "8px" },
}: DownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById("receipt-content");
    if (!receipt) return;

    // Single source of truth — driven by the parent component, not the DOM.
    const isEfdReceipt = isEfd;

    const btn = document.querySelector(
      "[data-download-button]",
    ) as HTMLButtonElement | null;

    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating…";
      }

      // ── 1. Snapshot + normalise layout ─────────────────────────────
      const saved = {
        width: receipt.style.width,
        maxWidth: receipt.style.maxWidth,
        margin: receipt.style.margin,
        padding: receipt.style.padding,
        transform: receipt.style.transform,
        position: receipt.style.position,
        backgroundColor: receipt.style.backgroundColor,
        borderRadius: receipt.style.borderRadius,
        boxShadow: receipt.style.boxShadow,
      };

      // EFD captures at its natural ~420px width to preserve the design.
      // Modern card stretches to 794px (A4 portrait inner width).
      const captureWidth = isEfdReceipt ? 420 : 794;

      Object.assign(receipt.style, {
        width: `${captureWidth}px`,
        maxWidth: `${captureWidth}px`,
        margin: "0",
        padding: "0",
        transform: "none",
        position: "relative",
        backgroundColor: "#ffffff",
        borderRadius: "0",
        boxShadow: "none",
      });

      // Wait for layout reflow + images (logo, QR)
      await new Promise((r) => setTimeout(r, 200));
      await Promise.all(
        Array.from(receipt.querySelectorAll("img")).map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((r) => {
            img.onload = r;
            img.onerror = r;
            setTimeout(r, 5000);
          });
        }),
      );

      // ── 2. Capture ─────────────────────────────────────────────────
      const canvas = await html2canvas(receipt, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        width: captureWidth,
        height: receipt.scrollHeight,
        windowWidth: 1200,
        windowHeight: receipt.scrollHeight + 100,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (_doc, el) => {
          // ===========================================================
          // EFD RECEIPT — render AS-IS, only fix html2canvas quirks
          // ===========================================================
          if (isEfdReceipt) {
            Object.assign(el.style, {
              width: `${captureWidth}px`,
              maxWidth: `${captureWidth}px`,
              margin: "0",
              padding: "0",
              transform: "none",
              position: "relative",
              backgroundColor: "#ffffff",
            });

            // Ensure print color fidelity + image rendering
            el.querySelectorAll<HTMLElement>("*").forEach((node) => {
              (node.style as any).printColorAdjust = "exact";
              (node.style as any).webkitPrintColorAdjust = "exact";
              node.style.visibility = "visible";
              node.style.opacity = "1";
            });

            // QR code: ensure it has explicit dimensions
            // (html2canvas sometimes drops responsive img sizing)
            el.querySelectorAll<HTMLElement>("img").forEach((img) => {
              const alt = img.getAttribute("alt") ?? "";
              if (alt.toLowerCase().includes("qr")) {
                img.style.setProperty("width", "160px", "important");
                img.style.setProperty("height", "160px", "important");
                img.style.setProperty("display", "block", "important");
                img.style.setProperty("margin", "0 auto", "important");
              }
            });

            // Hide any action buttons that may be inside the capture region
            el.querySelectorAll<HTMLElement>(
              "[data-download-button], button",
            ).forEach((n) =>
              n.style.setProperty("display", "none", "important"),
            );

            return; // skip the modern-card transformation pipeline
          }

          // ===========================================================
          // MODERN CARD BRANCH (your original logic, unchanged)
          // ===========================================================
          Object.assign(el.style, {
            width: `${captureWidth}px`,
            maxWidth: `${captureWidth}px`,
            margin: "0",
            padding: "0",
            transform: "none",
            position: "relative",
            backgroundColor: "#ffffff",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#000000",
          });

          el.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";
            node.style.color = "#000000";

            if (node.style.borderColor || node.style.border) {
              node.style.borderColor = "#000000";
            }
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

          el.querySelectorAll<HTMLElement>(".lg\\:hidden").forEach((node) => {
            if (node.querySelector('[class*="rounded-lg"]')) {
              node.style.setProperty("display", "none", "important");
            }
          });
          el.querySelectorAll<HTMLElement>(
            ".hidden.lg\\:block, .hidden.lg\\:table",
          ).forEach((node) => {
            node.style.setProperty("display", "block", "important");
          });

          el.querySelectorAll<HTMLElement>("span").forEach((span) => {
            const txt = span.textContent?.trim() ?? "";
            if (txt === "PAID" || txt === "NOT PAID" || txt === "EFD RECEIPT") {
              const wrapper = span.closest<HTMLElement>("div");
              if (wrapper)
                wrapper.style.setProperty("display", "none", "important");
              span.style.setProperty("display", "none", "important");
            }
          });

          el.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            const txt = h.textContent?.trim().toUpperCase() ?? "";
            if (txt === "INVOICE" || txt === "RECEIPT") {
              h.style.setProperty("color", PRIMARY_DARK, "important");
              h.style.setProperty("font-size", "32px", "important");
              h.style.setProperty("font-weight", "300", "important");
              h.style.setProperty("letter-spacing", "0.05em", "important");
            }
          });

          el.querySelectorAll<HTMLElement>("h1").forEach((h) => {
            h.style.setProperty("color", "#000000", "important");
            h.style.setProperty("font-size", "16px", "important");
            h.style.setProperty("font-weight", "700", "important");
          });

          el.querySelectorAll<HTMLElement>("thead tr").forEach((tr) => {
            tr.style.setProperty("background-color", PRIMARY_DARK, "important");
            (tr.style as any).printColorAdjust = "exact";
            (tr.style as any).webkitPrintColorAdjust = "exact";
          });
          el.querySelectorAll<HTMLElement>("thead th").forEach((th) => {
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

          el.querySelectorAll<HTMLElement>("table").forEach((table) => {
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
          });

          el.querySelectorAll<HTMLElement>("table").forEach((table) => {
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

            table.querySelectorAll<HTMLElement>("td").forEach((td) => {
              const cs = window.getComputedStyle(td);
              if (
                cs.color.includes("235, 127, 68") ||
                cs.color.includes("196, 98, 42")
              ) {
                td.style.setProperty("color", PRIMARY_DARK, "important");
                td.style.setProperty("font-weight", "700", "important");
              }
            });
          });

          el.querySelectorAll<HTMLElement>(".flex.justify-between").forEach(
            (row) => {
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.setProperty("font-size", "12px", "important");
                s.style.setProperty("color", "#000000", "important");
              });
            },
          );

          el.querySelectorAll<HTMLElement>(
            ".flex.justify-between.font-bold",
          ).forEach((row) => {
            row.querySelectorAll<HTMLElement>("span").forEach((s) => {
              const cs = window.getComputedStyle(s);
              if (
                cs.color.includes("235, 127, 68") ||
                cs.color.includes("196, 98, 42")
              ) {
                s.style.setProperty("color", PRIMARY_DARK, "important");
                s.style.setProperty("font-weight", "800", "important");
                s.style.setProperty("font-size", "13px", "important");
              } else {
                s.style.setProperty("color", "#000000", "important");
                s.style.setProperty("font-weight", "700", "important");
                s.style.setProperty("font-size", "13px", "important");
              }
            });
          });

          el.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const style = div.getAttribute("style") ?? "";
            if (
              style.includes("fde8d8") ||
              style.includes("F2942233") ||
              style.includes("f2942233")
            ) {
              div.style.setProperty(
                "background-color",
                PRIMARY_BG,
                "important",
              );
              div.style.setProperty("border-radius", "6px", "important");
              div.style.setProperty("padding", "10px 12px", "important");
              div.style.setProperty("border", "1px solid #000000", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
              div.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.setProperty("color", PRIMARY_DARK, "important");
                s.style.setProperty("font-weight", "800", "important");
                s.style.setProperty("font-size", "13px", "important");
              });
            }
          });

          el.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px" || div.classList.contains("h-px")) {
              div.style.setProperty("background-color", "#000000", "important");
              div.style.setProperty("border", "none", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });
          el.querySelectorAll<HTMLElement>(
            '[role="none"], [data-orientation="horizontal"]',
          ).forEach((sep) => {
            sep.style.setProperty("height", "1px", "important");
            sep.style.setProperty("background-color", "#000000", "important");
            sep.style.setProperty("border", "none", "important");
            (sep.style as any).printColorAdjust = "exact";
            (sep.style as any).webkitPrintColorAdjust = "exact";
          });

          el.querySelectorAll<HTMLElement>("p, span").forEach((node) => {
            const txt = node.textContent ?? "";
            if (
              txt.includes("Powered by") ||
              txt.includes("Thank you") ||
              txt.includes("Closed by")
            ) {
              node.style.setProperty(
                "font-size",
                fontSize.footer ?? "9px",
                "important",
              );
              node.style.setProperty("color", "#000000", "important");
            }
          });

          el.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent?.trim().toUpperCase() ?? "";
            if (txt === "BILL TO") {
              p.style.setProperty("font-size", "9px", "important");
              p.style.setProperty("color", "#000000", "important");
              p.style.setProperty("font-weight", "700", "important");
              p.style.setProperty("letter-spacing", "0.12em", "important");
              p.style.setProperty("text-transform", "uppercase", "important");
            }
          });

          el.querySelectorAll<HTMLElement>("p, span, div, li").forEach(
            (node) => {
              const ownText = (node.textContent ?? "").trim();
              if (
                ownText.startsWith("Generated on") ||
                ownText.includes("Confirmed by customer") ||
                ownText.includes("✓ Confirmed") ||
                ownText.includes("√ Confirmed")
              ) {
                node.style.setProperty("display", "none", "important");
              }
            },
          );
        },
      });

      // ── 3. Restore original styles ──────────────────────────────────
      Object.assign(receipt.style, saved);

      // ── 4. Build PDF ────────────────────────────────────────────────
      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 10;

      // EFD: keep narrower + centered to mimic a thermal receipt
      // Modern card: full A4 inner width
      const printW = isEfdReceipt ? 90 : A4_W - MARGIN * 2;
      const xOffset = isEfdReceipt ? (A4_W - printW) / 2 : MARGIN;
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
          xOffset,
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
            xOffset,
            MARGIN,
            printW,
            sliceH,
            undefined,
            "FAST",
          );
        }
      }

      const filePrefix = isEfdReceipt ? "efd-receipt" : "receipt";
      pdf.save(`${filePrefix}-${orderNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${title}`;
      }
    }
  }, [orderNumber, fontSize, title, isEfd]);

  useEffect(() => {
    if (isDownloadable) handleDownload();
  }, [isDownloadable, handleDownload]);

  return (
    <button
      data-download-button
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

export default DownloadButton;
