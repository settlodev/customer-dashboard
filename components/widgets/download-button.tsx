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
const PRIMARY_LIGHT = "#F2942233"; // used as bg tint
const SECONDARY = "#EAEAE5";

const DownloadButton = ({
  orderNumber,
  isDownloadable,
  title,
  fontSize = {
    header: "14px",
    body: "10px",
    footer: "8px",
  },
}: DownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const receipt = document.getElementById("receipt-content");
    if (!receipt) return;

    try {
      // Show loading state
      const btn = document.querySelector(
        "[data-download-button]",
      ) as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating...";
      }

      // Snapshot original styles
      const originalStyles = {
        width: receipt.style.width,
        maxWidth: receipt.style.maxWidth,
        margin: receipt.style.margin,
        padding: receipt.style.padding,
        transform: receipt.style.transform,
        position: receipt.style.position,
        backgroundColor: receipt.style.backgroundColor,
      };

      // Force A4-width layout for capture
      receipt.style.width = "794px";
      receipt.style.maxWidth = "794px";
      receipt.style.margin = "0";
      receipt.style.padding = "0";
      receipt.style.transform = "none";
      receipt.style.position = "relative";
      receipt.style.backgroundColor = "#ffffff";

      // Wait for layout + images
      await new Promise((r) => setTimeout(r, 150));
      const images = receipt.querySelectorAll("img");
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

      const canvas = await html2canvas(receipt, {
        scale: 2,
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
          el.style.cssText = `
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

          // ── Force all inline colors to render ──────────────────────
          el.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";

            // Re-apply brand color where Tailwind classes were used
            // (html2canvas sometimes strips computed colors)
            const cs = window.getComputedStyle(node);
            const color = cs.color;
            const bg = cs.backgroundColor;

            // Preserve explicit inline style colors (set via style={{}})
            // These are already inlined and will render fine.
            // Only override elements using *only* Tailwind classes for color.

            // Fix: elements whose computed bg is orange → force it
            if (
              bg &&
              (bg.includes("235, 127, 68") || bg.includes("242, 148, 34"))
            ) {
              node.style.backgroundColor = bg;
              node.style.setProperty("background-color", bg, "important");
            }
            if (
              color &&
              (color.includes("235, 127, 68") || color.includes("242, 148, 34"))
            ) {
              node.style.color = color;
              node.style.setProperty("color", color, "important");
            }
          });

          // ── Table header rows (orange background) ──────────────────
          el.querySelectorAll<HTMLElement>("thead tr").forEach((tr) => {
            tr.style.setProperty("background-color", PRIMARY, "important");
          });
          el.querySelectorAll<HTMLElement>("thead th").forEach((th) => {
            th.style.setProperty("background-color", PRIMARY, "important");
            th.style.setProperty("color", "#ffffff", "important");
            th.style.fontSize = "9px";
            th.style.fontWeight = "600";
            th.style.padding = "10px 14px";
            th.style.textTransform = "uppercase";
            th.style.letterSpacing = "0.05em";
          });

          // ── Tables — items table (has thead) vs meta table (no thead) ──
          el.querySelectorAll<HTMLElement>("table").forEach((table) => {
            const hasHeader = table.querySelector("thead") !== null;

            if (hasHeader) {
              // Items table — zebra striping + row dividers
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
                td.style.fontSize = fontSize.body ?? "10px";
                td.style.padding = "10px 14px";
                td.style.color = "#374151";
              });
            } else {
              // Invoice meta table — no borders, no background, clean look
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
                td.style.fontSize = fontSize.body ?? "10px";
                td.style.padding = "5px 8px";
              });
            }
          });

          // ── Amount Due highlighted row ─────────────────────────────
          el.querySelectorAll<HTMLElement>(
            '[style*="F2942233"], [style*="f2942233"]',
          ).forEach((node) => {
            node.style.setProperty("background-color", "#fde8d8", "important");
          });

          // ── Text that should be orange ─────────────────────────────
          // Business name h1, doc title h2, section labels, totals
          el.querySelectorAll<HTMLElement>("h1, h2").forEach((h) => {
            const cs = window.getComputedStyle(h);
            if (cs.color.includes("235, 127, 68")) {
              h.style.setProperty("color", PRIMARY, "important");
            }
          });

          // ── Hide PAID / NOT PAID / EFD RECEIPT status badges ──────
          // Find the wrapper div that contains the status badges and hide it
          el.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const spans = div.querySelectorAll("span");
            spans.forEach((span) => {
              const txt = span.textContent?.trim() ?? "";
              if (
                txt === "PAID" ||
                txt === "NOT PAID" ||
                txt === "EFD RECEIPT"
              ) {
                // Hide the entire badge wrapper
                (span.closest("div") as HTMLElement | null)?.style.setProperty(
                  "display",
                  "none",
                  "important",
                );
                span.style.setProperty("display", "none", "important");
              }
            });
          });

          // Force all spans/divs with computed orange color
          el.querySelectorAll<HTMLElement>("span, div, p, td, th").forEach(
            (node) => {
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
            },
          );

          // ── Dividers ───────────────────────────────────────────────
          el.querySelectorAll<HTMLElement>('[style*="1px solid"]').forEach(
            (node) => {
              // Already inlined — just ensure they're visible
              const s = node.getAttribute("style") ?? "";
              if (s.includes("EAEAE5") || s.includes("eaeae5")) {
                node.style.setProperty("border-color", SECONDARY, "important");
              }
            },
          );

          // ── Typography ─────────────────────────────────────────────
          el.querySelectorAll<HTMLElement>("p, span, li").forEach((node) => {
            node.style.fontFamily = "system-ui, -apple-system, sans-serif";
            node.style.lineHeight = "1.5";
            if (!node.style.fontSize)
              node.style.fontSize = fontSize.body ?? "10px";
          });

          el.querySelectorAll<HTMLElement>("h1, h2, h3, h4").forEach((h) => {
            h.style.fontFamily = "system-ui, -apple-system, sans-serif";
            h.style.lineHeight = "1.2";
          });

          // ── Footer text ────────────────────────────────────────────
          el.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent ?? "";
            if (
              txt.includes("Thank you") ||
              txt.includes("generated on") ||
              txt.includes("Powered by") ||
              txt.includes("Closed by")
            ) {
              if (!p.style.color || p.style.color === "") {
                p.style.color = "#6b7280";
              }
              p.style.fontSize = fontSize.footer ?? "8px";
            }
          });

          // ── Mobile-only cards: hide in PDF (desktop table already shown) ──
          el.querySelectorAll<HTMLElement>(".lg\\:hidden").forEach((node) => {
            // Only hide the mobile items section, not other lg:hidden elements
            if (node.querySelector('[class*="rounded-lg"]')) {
              node.style.display = "none";
            }
          });
          // Show desktop table
          el.querySelectorAll<HTMLElement>(
            ".hidden.lg\\:block, .hidden.lg\\:table",
          ).forEach((node) => {
            node.style.display = "block";
          });
        },
      });

      // Restore original styles
      Object.assign(receipt.style, originalStyles);

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
        // Single page
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
        // Multi-page
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

      pdf.save(`receipt-${orderNumber}.pdf`);

      // Reset button
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${title}`;
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("There was an error generating the PDF. Please try again.");

      const btn = document.querySelector(
        "[data-download-button]",
      ) as HTMLButtonElement;
      if (btn) {
        btn.disabled = false;
        btn.textContent = title;
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
          "#d4703a")
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
