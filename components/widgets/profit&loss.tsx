import React, { useRef, useState } from "react";
import {
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import SummaryResponse from "@/types/dashboard/type";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import ReportLetterhead from "@/components/widgets/report-letterhead";

const PRIMARY = "#EB7F44";
const PRIMARY_DARK = "#C4622A";
const SECONDARY = "#EAEAE5";

const ProfitLossStatement = ({
  salesData,
  business,
  location,
}: {
  salesData: SummaryResponse;
  business: Business;
  location: Location;
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fmt = (v: any) =>
    v == null ? "0" : `TZS ${Number(v).toLocaleString("en-US")}`;

  const fmtDate = (d: any) => {
    if (!d) return "";
    const dt = new Date(d);
    return (
      dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      ", " +
      dt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  const grossMargin = salesData.netSales
    ? ((salesData.grossProfit / salesData.netSales) * 100).toFixed(1)
    : "0";
  const netMargin = salesData.netSales
    ? (((salesData.closingBalance ?? 0) / salesData.netSales) * 100).toFixed(1)
    : "0";
  const isProfit = (salesData.closingBalance ?? 0) >= 0;

  const generatePDF = async () => {
    const el = printRef.current;
    if (!el) return;
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
        borderRadius: el.style.borderRadius,
        position: el.style.position,
      };
      Object.assign(el.style, {
        width: "794px",
        maxWidth: "794px",
        margin: "0",
        boxShadow: "none",
        borderRadius: "0",
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

      const sd = new Date(salesData.startDate);
      const ed = new Date(salesData.endDate);
      const pad = (n: number) => n.toString().padStart(2, "0");
      pdf.save(
        `profit-loss-${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}-to-${ed.getFullYear()}-${pad(ed.getMonth() + 1)}-${pad(ed.getDate())}.pdf`,
      );
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ── Reusable row ─────────────────────────────────────────────────────
  const Row = ({
    label,
    value,
    indent = false,
    muted = false,
  }: {
    label: React.ReactNode;
    value: string;
    indent?: boolean;
    muted?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: `1px solid ${SECONDARY}`,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: muted ? "#6b7280" : "#111827",
          paddingLeft: indent ? 24 : 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: muted ? "#9ca3af" : "#111827",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        padding: "14px 16px 6px",
        borderBottom: `1px solid ${SECONDARY}`,
        backgroundColor: "#f9fafb",
      }}
    >
      {children}
    </div>
  );

  const SummaryRow = ({
    label,
    value,
    color = "#111827",
    bg = "#f3f4f6",
    large = false,
  }: {
    label: string;
    value: string;
    color?: string;
    bg?: string;
    large?: boolean;
  }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: large ? "14px 16px" : "10px 16px",
        backgroundColor: bg,
        borderTop: `2px solid ${color}20`,
      }}
    >
      <span
        style={{ fontSize: large ? 14 : 13, fontWeight: 700, color: "#111827" }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: large ? 18 : 14,
          fontWeight: 800,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Key metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Gross sales",
            value: fmt(salesData.grossSales),
            accent: "bg-blue-500",
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Net sales",
            value: fmt(salesData.netSales),
            accent: "bg-cyan-500",
            color: "text-cyan-600 dark:text-cyan-400",
          },
          {
            label: "Gross profit",
            value: fmt(salesData.grossProfit),
            sub: `${grossMargin}% margin`,
            accent: "bg-emerald-500",
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: isProfit ? "Net profit" : "Net loss",
            value: fmt(salesData.closingBalance),
            sub: `${netMargin}% margin`,
            accent: isProfit ? "bg-emerald-500" : "bg-red-500",
            color: isProfit
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-background border rounded-xl p-4 relative overflow-hidden"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] ${card.accent} rounded-l-xl`}
            />
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
              {card.label}
            </p>
            <p
              className={`text-xl font-semibold tabular-nums leading-tight ${card.color}`}
            >
              {card.value}
            </p>
            {card.sub && (
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Detailed statement (screen UI) ── */}
      <div className="bg-background border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Detailed statement
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={generatePDF}
            disabled={downloadingPdf}
            className="h-8 text-xs gap-1.5"
          >
            {downloadingPdf ? (
              <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloadingPdf ? "Generating…" : "Download PDF"}
          </Button>
        </div>
        <div className="p-5 space-y-5">
          <ReportLetterhead business={business} location={location} />
          {/* Revenue */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Revenue
            </p>
            <div className="border rounded-lg divide-y text-sm">
              <div className="flex justify-between items-center py-3 px-4">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Gross sales
                </span>
                <span className="tabular-nums font-medium">
                  {fmt(salesData.grossSales)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4">
                <span className="flex items-center gap-2 text-muted-foreground pl-5">
                  <RefreshCcw className="h-3 w-3" />
                  Less: Discounts
                </span>
                <span className="tabular-nums text-muted-foreground">
                  ({fmt(salesData.totalDiscount)})
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4">
                <span className="flex items-center gap-2 text-muted-foreground pl-5">
                  <RefreshCcw className="h-3 w-3" />
                  Less: Refunds
                </span>
                <span className="tabular-nums text-muted-foreground">
                  ({fmt(salesData.refundsAmount)})
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <span className="font-semibold">Net sales</span>
              <span className="tabular-nums font-bold">
                {fmt(salesData.netSales)}
              </span>
            </div>
          </div>
          <Separator />
          {/* Cost of sales */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Cost of sales
            </p>
            <div className="border rounded-lg text-sm">
              <div className="flex justify-between items-center py-3 px-4">
                <span className="flex items-center gap-2">
                  <BarChart className="h-3.5 w-3.5 text-muted-foreground" />
                  Cost of goods sold
                </span>
                <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
                  {fmt(salesData.totalCost)}
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm">
              <div>
                <span className="font-semibold">Gross profit</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {grossMargin}% margin
                </span>
              </div>
              <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {fmt(salesData.grossProfit)}
              </span>
            </div>
          </div>
          <Separator />
          {/* Operating expenses */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-3">
              Operating expenses
            </p>
            <div className="border rounded-lg text-sm">
              <div className="flex justify-between items-center py-3 px-4">
                <span className="flex items-center gap-2">
                  <BarChart className="h-3.5 w-3.5 text-muted-foreground" />
                  Total expenses
                </span>
                <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
                  {fmt(salesData.totalExpensePaidAmount)}
                </span>
              </div>
            </div>
          </div>
          <Separator />
          {/* Net profit / loss */}
          <div
            className={cn(
              "flex justify-between items-center rounded-lg p-4 text-sm",
              isProfit
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : "bg-red-50 dark:bg-red-950/30",
            )}
          >
            <div>
              <p className="font-semibold">
                {isProfit ? "Net profit" : "Net loss"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Net margin: {netMargin}%
              </p>
            </div>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {fmt(salesData.closingBalance)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-1">
            This report was generated automatically. Any discrepancies should be
            reported to support@settlo.co.tz.
          </p>
        </div>
      </div>

      {/* ── Hidden print-optimised template (html2canvas target) ── */}
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
          {/* ── Header ── */}
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
              {/* Left: business */}
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {business.name}
                </div>
                {location.name && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.name}
                  </div>
                )}
                {(location.address || location.city) && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {[location.address, location.city, location.region]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
                {location.phone && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Tel: {location.phone}
                  </div>
                )}
                {location.email && (
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {location.email}
                  </div>
                )}
                {business.identificationNumber && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    TIN: {business.identificationNumber}
                  </div>
                )}
                {business.vrn && (
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    VRN: {business.vrn}
                  </div>
                )}
              </div>
              {/* Right: title */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 300,
                    color: PRIMARY,
                    letterSpacing: "0.04em",
                  }}
                >
                  PROFIT & LOSS
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  STATEMENT
                </div>
              </div>
            </div>

            {/* Period bar */}
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
              <span>
                Period:{" "}
                <strong style={{ color: "#111827" }}>
                  {fmtDate(salesData.startDate)} — {fmtDate(salesData.endDate)}
                </strong>
              </span>
              <span>
                Generated:{" "}
                <strong style={{ color: "#111827" }}>
                  {fmtDate(new Date().toISOString())}
                </strong>
              </span>
            </div>
          </div>

          {/* ── Summary strip ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 0,
              margin: "24px 32px",
              border: `1px solid ${SECONDARY}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Gross sales", value: fmt(salesData.grossSales) },
              { label: "Net sales", value: fmt(salesData.netSales) },
              {
                label: "Gross profit",
                value: fmt(salesData.grossProfit),
                sub: `${grossMargin}% margin`,
              },
              {
                label: isProfit ? "Net profit" : "Net loss",
                value: fmt(salesData.closingBalance),
                sub: `${netMargin}% margin`,
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderLeft: i > 0 ? `1px solid ${SECONDARY}` : "none",
                  borderTop: `3px solid #111827`,
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
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#111827",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.value}
                </div>
                {c.sub && (
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                    {c.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Statement body ── */}
          <div
            style={{
              margin: "0 32px 32px",
              border: `1px solid ${SECONDARY}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <SectionTitle>Revenue</SectionTitle>
            <Row label="Gross sales" value={fmt(salesData.grossSales)} />
            <Row
              label="Less: Discounts"
              value={`(${fmt(salesData.totalDiscount)})`}
              indent
              muted
            />
            <Row
              label="Less: Refunds"
              value={`(${fmt(salesData.refundsAmount)})`}
              indent
              muted
            />
            <SummaryRow label="Net sales" value={fmt(salesData.netSales)} />

            <SectionTitle>Cost of sales</SectionTitle>
            <Row
              label="Cost of goods sold (COGS)"
              value={fmt(salesData.totalCost)}
            />
            <SummaryRow
              label={`Gross profit (${grossMargin}% margin)`}
              value={fmt(salesData.grossProfit)}
              color="#111827"
              bg="#f9fafb"
            />

            <SectionTitle>Operating expenses</SectionTitle>
            <Row
              label="Total operating expenses"
              value={fmt(salesData.totalExpensePaidAmount)}
            />

            {/* Double line */}
            <div style={{ borderTop: "2px solid #111827", marginTop: 2 }} />
            <div style={{ borderTop: "1px solid #111827", marginBottom: 2 }} />

            <SummaryRow
              label={`${isProfit ? "NET PROFIT" : "NET LOSS"} — Net margin: ${netMargin}%`}
              value={fmt(salesData.closingBalance)}
              color="#111827"
              bg="#f3f4f6"
              large
            />
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              borderTop: `1px solid ${SECONDARY}`,
              margin: "0 32px",
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.6 }}>
              This report was generated automatically by the system. Any
              discrepancies should be reported to the Settlo Team through
              support@settlo.co.tz.
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
    </div>
  );
};

export default ProfitLossStatement;
