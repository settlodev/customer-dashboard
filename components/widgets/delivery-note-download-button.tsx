"use client";

import React, { useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const PRIMARY = "#EB7F44";
const PRIMARY_LIGHT = "#fde8d8";
const SECONDARY = "#EAEAE5";

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
  fontSize = {
    header: "14px",
    body: "10px",
    footer: "8px",
  },
}: DeliveryNoteDownloadButtonProps) => {
  const handleDownload = useCallback(async () => {
    const el = document.getElementById("delivery-note-content");
    if (!el) return;

    try {
      // ── Loading state ───────────────────────────────────────────────
      const btn = document.querySelector(
        "[data-delivery-download-button]",
      ) as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating...";
      }

      // ── Snapshot original styles ────────────────────────────────────
      const originalStyles = {
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        margin: el.style.margin,
        padding: el.style.padding,
        transform: el.style.transform,
        position: el.style.position,
        backgroundColor: el.style.backgroundColor,
      };

      // ── Force A4 layout ─────────────────────────────────────────────
      el.style.width = "794px";
      el.style.maxWidth = "794px";
      el.style.margin = "0";
      el.style.padding = "0";
      el.style.transform = "none";
      el.style.position = "relative";
      el.style.backgroundColor = "#ffffff";

      await new Promise((r) => setTimeout(r, 150));

      // ── Wait for images ─────────────────────────────────────────────
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
          // ── Base reset ────────────────────────────────────────────
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

          // ── Force print color rendering on all nodes ──────────────
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";

            // Re-apply computed orange colors (html2canvas can strip them)
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

          // ── Top / bottom accent bars ──────────────────────────────
          // They use inline style={{ backgroundColor: PRIMARY }} so they
          // should already render, but force them just in case
          clone.querySelectorAll<HTMLElement>("div").forEach((div) => {
            const s = div.getAttribute("style") ?? "";
            if (s.includes("EB7F44") || s.includes("eb7f44")) {
              div.style.setProperty("background-color", PRIMARY, "important");
            }
          });

          // ── Items table header (orange) ───────────────────────────
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
                th.style.padding = "10px 14px";
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
                td.style.fontSize = fontSize.body ?? "10px";
                td.style.padding = "10px 14px";
                td.style.color = "#374151";
              });
              // Total row — orange tint
              table
                .querySelectorAll<HTMLElement>("tfoot tr, tbody tr:last-child")
                .forEach((tr) => {
                  const style = tr.getAttribute("style") ?? "";
                  if (
                    style.includes("fde8d8") ||
                    style.includes("PRIMARY_LIGHT")
                  ) {
                    tr.style.setProperty(
                      "background-color",
                      PRIMARY_LIGHT,
                      "important",
                    );
                  }
                });
            } else {
              // Meta table (no thead) — clean, no borders, no bg
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

          // ── Force all computed orange text/bg ─────────────────────
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

          // ── Orange tint highlighted rows / boxes ──────────────────
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

          // ── Signature lines — keep dashed borders visible ─────────
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

          // ── Dashed fill-in spans ──────────────────────────────────
          clone
            .querySelectorAll<HTMLElement>('[style*="dashed"]')
            .forEach((node) => {
              node.style.setProperty(
                "border-bottom",
                "1.5px dashed #9ca3af",
                "important",
              );
            });

          // ── Hide mobile cards, show desktop table ─────────────────
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

          // ── Typography ────────────────────────────────────────────
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

          // ── Footer text ───────────────────────────────────────────
          clone.querySelectorAll<HTMLElement>("p").forEach((p) => {
            const txt = p.textContent ?? "";
            if (
              txt.includes("Thank you") ||
              txt.includes("generated on") ||
              txt.includes("Powered by") ||
              txt.includes("Dispatched by")
            ) {
              if (!p.style.color) p.style.color = "#6b7280";
              p.style.fontSize = fontSize.footer ?? "8px";
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

      pdf.save(`delivery-note-${orderNumber}.pdf`);

      // ── Reset button ─────────────────────────────────────────────────
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${title}`;
      }
    } catch (err) {
      console.error("Delivery note PDF generation failed:", err);
      alert("There was an error generating the PDF. Please try again.");

      const btn = document.querySelector(
        "[data-delivery-download-button]",
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
      data-delivery-download-button
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

export default DeliveryNoteDownloadButton;
