"use client";

import React, { useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface DownloadButtonProps {
  orderNumber: string;
  isDownloadable?: boolean;
  title: string;
  fontSize?: {
    header?: string;
    body?: string;
    footer?: string;
  };
}

const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";
const PRIMARY_BG = "#fde8d8";
const SECONDARY = "#EAEAE5";
const ROW_ALT = "#F0F0EC";

const DownloadButton = ({
  orderNumber,
  isDownloadable,
  title,
  fontSize = { header: "14px", body: "10px", footer: "8px" },
}: DownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById("receipt-content");
    if (!receipt) return;

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
      Object.assign(receipt.style, {
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

      // Wait for layout reflow + images
      await new Promise((r) => setTimeout(r, 150));
      await Promise.all(
        Array.from(receipt.querySelectorAll("img")).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((r) => {
            img.onload = r;
            img.onerror = r;
            setTimeout(r, 5000);
          });
        }),
      );

      // ── 2. Capture ─────────────────────────────────────────────────
      const canvas = await html2canvas(receipt, {
        scale: 3, // 3× for crisp print output
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: receipt.scrollHeight,
        windowWidth: 1200,
        windowHeight: receipt.scrollHeight + 100,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (_doc, el) => {
          // ── Base reset ──────────────────────────────────────────────
          Object.assign(el.style, {
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

          // Make every node fully visible + colour-adjust
          el.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
            node.style.fontFamily = "inherit";
          });

          // ── Hide mobile-only elements, show desktop ones ─────────
          el.querySelectorAll<HTMLElement>(".lg\\:hidden").forEach((node) => {
            // Only hide the mobile items card list, not other sections
            if (node.querySelector('[class*="rounded-lg"]')) {
              node.style.setProperty("display", "none", "important");
            }
          });
          el.querySelectorAll<HTMLElement>(
            ".hidden.lg\\:block, .hidden.lg\\:table",
          ).forEach((node) => {
            node.style.setProperty("display", "block", "important");
          });

          // ── Hide status badges (PAID / NOT PAID / EFD RECEIPT) ────
          el.querySelectorAll<HTMLElement>("span").forEach((span) => {
            const txt = span.textContent?.trim() ?? "";
            if (txt === "PAID" || txt === "NOT PAID" || txt === "EFD RECEIPT") {
              const wrapper = span.closest<HTMLElement>("div");
              if (wrapper)
                wrapper.style.setProperty("display", "none", "important");
              span.style.setProperty("display", "none", "important");
            }
          });

          // ── INVOICE / RECEIPT heading ─────────────────────────────
          el.querySelectorAll<HTMLElement>("h2").forEach((h) => {
            const txt = h.textContent?.trim().toUpperCase() ?? "";
            if (txt === "INVOICE" || txt === "RECEIPT") {
              h.style.setProperty("color", PRIMARY_DARK, "important");
              h.style.setProperty("font-size", "32px", "important");
              h.style.setProperty("font-weight", "300", "important");
              h.style.setProperty("letter-spacing", "0.05em", "important");
            }
          });

          // ── Business name h1 ─────────────────────────────────────
          el.querySelectorAll<HTMLElement>("h1").forEach((h) => {
            h.style.setProperty("color", "#111827", "important");
            h.style.setProperty("font-size", "16px", "important");
            h.style.setProperty("font-weight", "700", "important");
          });

          // ── Items table header ────────────────────────────────────
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
            (th.style as any).printColorAdjust = "exact";
            (th.style as any).webkitPrintColorAdjust = "exact";
          });

          // ── Items table — zebra rows + cells ─────────────────────
          el.querySelectorAll<HTMLElement>("table").forEach((table) => {
            if (!table.querySelector("thead")) return; // skip meta table

            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
              const bg = i % 2 === 0 ? "#ffffff" : ROW_ALT;
              tr.style.setProperty("background-color", bg, "important");
              tr.style.setProperty(
                "border-bottom",
                `1px solid #C8C8C2`,
                "important",
              );
              (tr.style as any).printColorAdjust = "exact";
              (tr.style as any).webkitPrintColorAdjust = "exact";
            });

            // Last column per row — bold & dark
            table.querySelectorAll<HTMLElement>("tbody tr").forEach((tr) => {
              const cells = tr.querySelectorAll<HTMLElement>("td");
              cells.forEach((td, ci) => {
                td.style.setProperty(
                  "font-size",
                  fontSize.body ?? "10px",
                  "important",
                );
                td.style.setProperty("padding", "10px 14px", "important");
                td.style.setProperty("color", "#1f2937", "important");
                if (ci === cells.length - 1) {
                  td.style.setProperty("font-weight", "700", "important");
                  td.style.setProperty("color", "#111827", "important");
                }
              });
            });
          });

          // ── Meta table (Invoice Number / Date / Staff / Amount) ───
          el.querySelectorAll<HTMLElement>("table").forEach((table) => {
            if (table.querySelector("thead")) return; // skip items table

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
            // Amount Due value cell — keep it orange but darker
            table.querySelectorAll<HTMLElement>("td").forEach((td) => {
              if (
                td.style.color?.includes("235, 127, 68") ||
                td.style.color === PRIMARY ||
                window.getComputedStyle(td).color.includes("235, 127, 68")
              ) {
                td.style.setProperty("color", PRIMARY_DARK, "important");
                td.style.setProperty("font-weight", "700", "important");
              }
            });
          });

          // ── Totals block rows ─────────────────────────────────────
          // Make all text inside the totals block dark and readable
          el.querySelectorAll<HTMLElement>(".flex.justify-between").forEach(
            (row) => {
              row.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.setProperty("font-size", "12px", "important");
                s.style.setProperty("color", "#1f2937", "important");
              });
            },
          );

          // Subtotal / Total / Net lines — bump to near-black
          el.querySelectorAll<HTMLElement>(
            ".flex.justify-between.font-bold",
          ).forEach((row) => {
            row.querySelectorAll<HTMLElement>("span").forEach((s) => {
              const txt = s.textContent?.trim() ?? "";
              // The right-hand value in Total row is orange — darken it
              if (
                s.style.color === PRIMARY ||
                window.getComputedStyle(s).color.includes("235, 127, 68")
              ) {
                s.style.setProperty("color", PRIMARY_DARK, "important");
                s.style.setProperty("font-weight", "800", "important");
                s.style.setProperty("font-size", "13px", "important");
              } else {
                s.style.setProperty("color", "#111827", "important");
                s.style.setProperty("font-weight", "700", "important");
                s.style.setProperty("font-size", "13px", "important");
              }
            });
          });

          // ── Amount Due highlighted row ────────────────────────────
          el.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const style = div.getAttribute("style") ?? "";
            if (
              style.includes("F2942233") ||
              style.includes("f2942233") ||
              style.includes("fde8d8")
            ) {
              div.style.setProperty(
                "background-color",
                PRIMARY_BG,
                "important",
              );
              div.style.setProperty("border-radius", "6px", "important");
              div.style.setProperty("padding", "10px 12px", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
              div.querySelectorAll<HTMLElement>("span").forEach((s) => {
                s.style.setProperty("color", PRIMARY_DARK, "important");
                s.style.setProperty("font-weight", "800", "important");
                s.style.setProperty("font-size", "13px", "important");
              });
            }
          });

          // ── Bill To section label ─────────────────────────────────
          el.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent?.trim().toUpperCase() ?? "";
            if (txt === "BILL TO") {
              p.style.setProperty("font-size", "9px", "important");
              p.style.setProperty("color", "#6b7280", "important");
              p.style.setProperty("letter-spacing", "0.12em", "important");
              p.style.setProperty("text-transform", "uppercase", "important");
            }
          });

          // ── All remaining light-gray text → legible for print ─────
          // Upgrade gray-400 / gray-500 to gray-600 minimum
          el.querySelectorAll<HTMLElement>("p, span, td, th, li").forEach(
            (node) => {
              if (node.closest("thead")) return;
              const cs = window.getComputedStyle(node);
              const c = cs.color;
              // rgb(156,163,175) = gray-400  rgb(107,114,128) = gray-500
              if (c.includes("156, 163") || c.includes("107, 114")) {
                node.style.setProperty("color", "#4b5563", "important"); // gray-600
              }
            },
          );

          // ── Separator lines ───────────────────────────────────────
          el.querySelectorAll<HTMLElement>("div").forEach((div) => {
            if (div.style.height === "1px") {
              div.style.setProperty("background-color", "#D1D5DB", "important");
              (div.style as any).printColorAdjust = "exact";
              (div.style as any).webkitPrintColorAdjust = "exact";
            }
          });
          el.querySelectorAll<HTMLElement>(
            '[style*="1px solid #EAEAE5"], [style*="1px solid #eaeae5"]',
          ).forEach((node) => {
            node.style.setProperty("border-color", "#C8C8C2", "important");
          });

          // ── Notes / Terms + footer ────────────────────────────────
          el.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent ?? "";
            if (
              txt.includes("generated on") ||
              txt.includes("Powered by") ||
              txt.includes("Thank you") ||
              txt.includes("Closed by")
            ) {
              p.style.setProperty(
                "font-size",
                fontSize.footer ?? "9px",
                "important",
              );
              p.style.setProperty("color", "#4b5563", "important");
            }
          });

          // ── Company address text (right-side header block) ────────
          el.querySelectorAll<HTMLElement>("div.text-sm.text-gray-600").forEach(
            (block) => {
              block.querySelectorAll<HTMLElement>("p").forEach((p) => {
                p.style.setProperty("font-size", "10px", "important");
                p.style.setProperty("color", "#374151", "important");
              });
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
        // Single page
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
        // Multi-page
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

      pdf.save(`receipt-${orderNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
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
