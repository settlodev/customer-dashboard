"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Credit } from "@/types/orders/type";
import type { Location } from "@/types/location/type";

interface Props {
  creditData: Credit | null;
  location: Location | null;
}

const PRIMARY = "#EB7F44";
const SECONDARY = "#EAEAE5";
const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export function CreditReportExport({ creditData, location }: Props) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const downloadCSV = () => {
    if (!creditData) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingCsv(true);
    try {
      const headers = [
        "Order Number",
        "Order Name",
        "Date",
        "Customer",
        "Paid Amount",
        "Unpaid Amount",
        "Status",
      ];
      const rows = creditData.unpaidOrders.map((o) =>
        [
          `"${o.orderNumber.replace(/"/g, '""')}"`,
          `"${(o.orderName || "N/A").replace(/"/g, '""')}"`,
          format(new Date(o.openedDate), "yyyy-MM-dd"),
          `"${(o.customerName || "N/A").replace(/"/g, '""')}"`,
          o.paidAmount,
          o.unpaidAmount,
          "Unpaid",
        ].join(","),
      );
      const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const filename = `credit-report-${format(new Date(creditData.startDate), "yyyy-MM-dd")}-to-${format(new Date(creditData.endDate), "yyyy-MM-dd")}.csv`;
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV Downloaded", description: `Saved as ${filename}` });
    } catch {
      toast({ variant: "destructive", title: "CSV Generation Failed" });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const generatePDF = async () => {
    const el = printRef.current;
    if (!el || !creditData) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    setDownloadingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const saved = {
        width: el.style.width,
        maxWidth: el.style.maxWidth,
        margin: el.style.margin,
        boxShadow: el.style.boxShadow,
        position: el.style.position,
      };
      Object.assign(el.style, {
        width: "794px",
        maxWidth: "794px",
        margin: "0",
        boxShadow: "none",
        position: "relative",
        backgroundColor: "#ffffff",
      });
      await new Promise((r) => setTimeout(r, 150));
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
        removeContainer: true,
        foreignObjectRendering: false,
        onclone: (_doc, clone) => {
          Object.assign(clone.style, {
            width: "794px",
            maxWidth: "794px",
            margin: "0",
            backgroundColor: "#ffffff",
          });
          clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
            node.style.visibility = "visible";
            node.style.opacity = "1";
            (node.style as any).printColorAdjust = "exact";
            (node.style as any).webkitPrintColorAdjust = "exact";
          });
        },
      });
      Object.assign(el.style, saved);
      const A4_W = 210,
        A4_H = 297,
        MARGIN = 10;
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
          pdf.addImage(
            slice.toDataURL("image/jpeg", 1.0),
            "JPEG",
            MARGIN,
            MARGIN,
            printW,
            (srcH * printW) / canvas.width,
            undefined,
            "FAST",
          );
        }
      }
      const filename = `credit-report-${format(new Date(creditData.startDate), "yyyy-MM-dd")}-to-${format(new Date(creditData.endDate), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      toast({ title: "PDF Downloaded", description: `Saved as ${filename}` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "PDF Generation Failed" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={downloadCSV}
          disabled={downloadingCsv || !creditData}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {downloadingCsv ? "Exporting…" : "CSV"}
        </Button>
        <Button
          onClick={generatePDF}
          disabled={downloadingPdf || !creditData}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {downloadingPdf ? "Exporting…" : "PDF"}
        </Button>
      </div>

      {/* ── Hidden print template ── */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <div
          ref={printRef}
          style={{
            width: 794,
            backgroundColor: "#ffffff",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#111827",
          }}
        >
          <div
            style={{ borderTop: "3px solid #111827", padding: "24px 32px 0" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {location?.name ?? ""}
                </div>
                {location?.address && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.address}
                  </div>
                )}
                {location?.phoneNumber && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Tel: {location.phoneNumber}
                  </div>
                )}
                {location?.email && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.email}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 300,
                    color: PRIMARY,
                    letterSpacing: "0.04em",
                  }}
                >
                  CREDIT
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>REPORT</div>
              </div>
            </div>
            <div
              style={{
                marginTop: 20,
                padding: "10px 0",
                borderTop: `1px solid ${SECONDARY}`,
                borderBottom: `1px solid ${SECONDARY}`,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              {creditData && (
                <>
                  <span>
                    Period:{" "}
                    <strong style={{ color: "#111827" }}>
                      {format(
                        new Date(creditData.startDate),
                        "MMM dd, yyyy HH:mm",
                      )}{" "}
                      —{" "}
                      {format(
                        new Date(creditData.endDate),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </strong>
                  </span>
                  <span>
                    Generated:{" "}
                    <strong style={{ color: "#111827" }}>
                      {format(new Date(), "MMM dd, yyyy HH:mm")}
                    </strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {creditData && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 0,
                  margin: "24px 32px",
                  border: `1px solid ${SECONDARY}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {[
                  {
                    label: "Total unpaid orders",
                    value: `${creditData.total} orders`,
                    sub: "Outstanding balances",
                  },
                  {
                    label: "Total unpaid amount",
                    value: `TZS ${fmt(creditData.totalUnpaidAmount)}`,
                    sub: "Yet to be collected",
                  },
                  {
                    label: "Total paid amount",
                    value: `TZS ${fmt(creditData.totalPaidAmount)}`,
                    sub: "Partially collected",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderLeft: i > 0 ? `1px solid ${SECONDARY}` : "none",
                      borderTop: "3px solid #111827",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 6,
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#111827",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {c.value}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  margin: "0 32px 32px",
                  border: `1px solid ${SECONDARY}`,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 100px 1fr 120px 120px 80px",
                    backgroundColor: "#111827",
                    padding: "10px 16px",
                    gap: 8,
                  }}
                >
                  {[
                    "Order #",
                    "Order Name",
                    "Date",
                    "Customer",
                    "Paid",
                    "Unpaid",
                    "Status",
                  ].map((h, i) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        textAlign: i >= 4 && i <= 5 ? "right" : "left",
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {creditData.unpaidOrders.map((order, i) => (
                  <div
                    key={order.orderId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px 1fr 100px 1fr 120px 120px 80px",
                      padding: "10px 16px",
                      gap: 8,
                      borderBottom:
                        i < creditData.unpaidOrders.length - 1
                          ? `1px solid ${SECONDARY}`
                          : "none",
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {order.orderNumber}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {order.orderName || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {format(new Date(order.openedDate), "dd MMM yyyy")}
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      {order.customerName || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#059669",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(order.paidAmount)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#dc2626",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      TZS {fmt(order.unpaidAmount)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#92400e",
                          backgroundColor: "#fef3c7",
                          padding: "2px 7px",
                          borderRadius: 20,
                          border: "1px solid #fcd34d",
                        }}
                      >
                        Unpaid
                      </span>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr 100px 1fr 120px 120px 80px",
                    padding: "12px 16px",
                    gap: 8,
                    backgroundColor: "#f3f4f6",
                    borderTop: "2px solid #111827",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#111827",
                      gridColumn: "span 4",
                    }}
                  >
                    Total ({creditData.unpaidOrders.length} orders)
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#059669",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(creditData.totalPaidAmount)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#dc2626",
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    TZS {fmt(creditData.totalUnpaidAmount)}
                  </div>
                  <div />
                </div>
              </div>
            </>
          )}

          <div
            style={{
              borderTop: `1px solid ${SECONDARY}`,
              margin: "0 32px",
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
              This report is confidential and intended solely for the recipient.
              Any discrepancies must be reported to support@settlo.co.tz within
              14 days of issuance.
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#d1d5db",
                marginTop: 6,
              }}
            >
              Powered by Settlo
            </div>
          </div>
          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}
