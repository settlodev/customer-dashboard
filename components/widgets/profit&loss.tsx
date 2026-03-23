import React, { useState } from "react";
import {
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart,
  RefreshCcw,
  Receipt,
  ArrowUpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import SummaryResponse from "@/types/dashboard/type";
import { Business } from "@/types/business/type";
import { Location } from "@/types/location/type";
import ReportLetterhead from "@/components/widgets/report-letterhead";

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

  const fmt = (v: any) =>
    v == null ? "0 TZS" : `${Number(v).toLocaleString()} TZS`;
  const fmtDate = (d: any) => {
    if (!d) return "";
    const dt = new Date(d);
    return (
      dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " " +
      dt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  const grossMargin = salesData.netSales
    ? ((salesData.grossProfit / salesData.netSales) * 100).toFixed(1)
    : 0;
  const netMargin = salesData.netSales
    ? (((salesData.closingBalance ?? 0) / salesData.netSales) * 100).toFixed(1)
    : 0;
  const isProfit = (salesData.closingBalance ?? 0) >= 0;

  const generatePDF = async () => {
    if (!salesData) return;
    setDownloadingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const cw = pageWidth - 2 * margin;

      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.8);
      doc.line(margin, 20, pageWidth - margin, 20);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(business.name || "Business", margin, 28);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      let hy = 33;
      if (location.name) {
        doc.text(location.name, margin, hy);
        hy += 4;
      }
      const addr = [location.address, location.city, location.region].filter(
        Boolean,
      );
      if (addr.length) {
        doc.text(addr.join(", "), margin, hy);
        hy += 4;
      }
      const contact = [
        location.phone && `Tel: ${location.phone}`,
        location.email,
      ].filter(Boolean);
      if (contact.length) doc.text(contact.join("  |  "), margin, hy);
      const rx = pageWidth - margin;
      let ty = 28;
      if (business.identificationNumber) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(`TIN: ${business.identificationNumber}`, rx, ty, {
          align: "right",
        });
        ty += 4;
      }
      if (business.vrn) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`VRN: ${business.vrn}`, rx, ty, { align: "right" });
        ty += 4;
      }
      if (business.serial) {
        doc.text(`Serial: ${business.serial}`, rx, ty, { align: "right" });
        ty += 4;
      }
      if (business.uin) {
        doc.text(`UIN: ${business.uin}`, rx, ty, { align: "right" });
      }
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, 45, pageWidth - margin, 45);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("PROFIT & LOSS STATEMENT", pageWidth / 2, 54, {
        align: "center",
      });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Period: ${fmtDate(salesData.startDate)} - ${fmtDate(salesData.endDate)}`,
        pageWidth / 2,
        60,
        { align: "center" },
      );
      doc.text(
        `Generated: ${fmtDate(new Date().toISOString())}`,
        pageWidth / 2,
        65,
        { align: "center" },
      );

      let yp = 78;
      const section = (title: string) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(title, margin, yp);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.line(margin, yp + 2, pageWidth - margin, yp + 2);
        yp += 8;
      };
      const summaryRow = (
        label: string,
        value: string,
        fill: number[],
        text: number[],
        fontSize = 10,
      ) => {
        (doc as any).autoTable({
          startY: yp,
          body: [[label, value]],
          margin: { left: margin, right: margin },
          styles: {
            fontSize,
            cellPadding: 4,
            fontStyle: "bold",
            fillColor: fill,
            textColor: text,
          },
          columnStyles: { 0: { cellWidth: cw * 0.65 }, 1: { halign: "right" } },
        });
        yp = (doc as any).lastAutoTable?.finalY + 2;
      };

      section("REVENUE");
      (doc as any).autoTable({
        startY: yp,
        body: [
          ["Gross Sales", fmt(salesData.grossSales)],
          ["    Less: Discounts", `(${fmt(salesData.totalDiscount)})`],
          ["    Less: Refunds", `(${fmt(salesData.refundsAmount)})`],
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: cw * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });
      yp = (doc as any).lastAutoTable?.finalY + 2;
      summaryRow(
        "Net Sales",
        fmt(salesData.netSales),
        [245, 245, 245],
        [30, 30, 30],
      );

      yp += 10;
      section("COST OF SALES");
      (doc as any).autoTable({
        startY: yp,
        body: [["Cost of Goods Sold (COGS)", fmt(salesData.totalCost)]],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: cw * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });
      yp = (doc as any).lastAutoTable?.finalY + 2;
      summaryRow(
        `Gross Profit (${grossMargin}% margin)`,
        fmt(salesData.grossProfit),
        [236, 253, 245],
        [21, 128, 61],
      );

      yp += 10;
      section("OPERATING EXPENSES");
      (doc as any).autoTable({
        startY: yp,
        body: [
          ["Total Operating Expenses", fmt(salesData.totalExpensePaidAmount)],
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: cw * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });
      yp = (doc as any).lastAutoTable?.finalY + 8;

      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.5);
      doc.line(margin, yp, pageWidth - margin, yp);
      doc.setLineWidth(0.2);
      doc.line(margin, yp + 1.5, pageWidth - margin, yp + 1.5);
      yp += 4;
      summaryRow(
        `${isProfit ? "NET PROFIT" : "NET LOSS"} (Net Margin: ${netMargin}%)`,
        fmt(salesData.closingBalance),
        isProfit ? [236, 253, 245] : [254, 242, 242],
        isProfit ? [21, 128, 61] : [220, 38, 38],
        12,
      );

      const footerSepY = Math.min(
        (doc as any).lastAutoTable?.finalY + 15,
        pageHeight - 35,
      );
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, footerSepY, pageWidth - margin, footerSepY);
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.setFont("helvetica", "normal");
      const disc =
        "This report was generated automatically by the system. Any discrepancies should be reported to the Settlo Team through support@settlo.co.tz.";
      const dlines = doc.splitTextToSize(disc, cw);
      dlines.forEach((l: string, i: number) =>
        doc.text(l, pageWidth / 2, footerSepY + 5 + i * 3, { align: "center" }),
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(160, 160, 160);
      doc.text(
        "Powered by Settlo",
        pageWidth / 2,
        footerSepY + 5 + dlines.length * 3 + 3,
        { align: "center" },
      );
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.8);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      const sd = new Date(salesData.startDate);
      const ed = new Date(salesData.endDate);
      const pad = (n: number) => n.toString().padStart(2, "0");
      doc.save(
        `profit-loss-${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}-to-${ed.getFullYear()}-${pad(ed.getMonth() + 1)}-${pad(ed.getDate())}.pdf`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Key metrics ── */}
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

      {/* ── Detailed statement ── */}
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
                <span className="flex items-center gap-2 text-foreground">
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
    </div>
  );
};

export default ProfitLossStatement;
