import React, { useState } from "react";
import {
  ArrowUpCircle,
  Download,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  BarChart,
  RefreshCcw,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

  const formatCurrency = (value: any) => {
    if (value === undefined || value === null) return "0 TZS";
    return `${value.toLocaleString()} TZS`;
  };

  const grossMargin = salesData.netSales
    ? ((salesData.grossProfit / salesData.netSales) * 100).toFixed(1)
    : 0;
  const netMargin = salesData.netSales
    ? ((salesData.netProfit / salesData.netSales) * 100).toFixed(1)
    : 0;

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

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
      const contentWidth = pageWidth - 2 * margin;

      // === HEADER BLOCK ===
      // Top border line
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.8);
      doc.line(margin, 20, pageWidth - margin, 20);

      // Business name (left)
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(business.name || "Business", margin, 28);

      // Location details (left, below business)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      let headerY = 33;

      if (location.name) {
        doc.text(location.name, margin, headerY);
        headerY += 4;
      }

      const addressParts = [location.address, location.city, location.region].filter(Boolean);
      if (addressParts.length) {
        doc.text(addressParts.join(", "), margin, headerY);
        headerY += 4;
      }

      const contactParts = [];
      if (location.phone) contactParts.push(`Tel: ${location.phone}`);
      if (location.email) contactParts.push(location.email);
      if (contactParts.length) {
        doc.text(contactParts.join("  |  "), margin, headerY);
      }

      // Tax details (right side)
      const rightX = pageWidth - margin;
      let taxY = 28;

      if (business.identificationNumber) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(`TIN: ${business.identificationNumber}`, rightX, taxY, { align: "right" });
        taxY += 4;
      }
      if (business.vrn) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`VRN: ${business.vrn}`, rightX, taxY, { align: "right" });
        taxY += 4;
      }
      if (business.serial) {
        doc.text(`Serial: ${business.serial}`, rightX, taxY, { align: "right" });
        taxY += 4;
      }
      if (business.uin) {
        doc.text(`UIN: ${business.uin}`, rightX, taxY, { align: "right" });
      }

      // Thin separator after header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, 45, pageWidth - margin, 45);

      // === TITLE ===
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("PROFIT & LOSS STATEMENT", pageWidth / 2, 54, { align: "center" });

      // Period and generated date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const periodText = `Period: ${formatDateTime(salesData.startDate)} - ${formatDateTime(salesData.endDate)}`;
      doc.text(periodText, pageWidth / 2, 60, { align: "center" });

      const genText = `Generated: ${formatDateTime(new Date().toISOString())}`;
      doc.text(genText, pageWidth / 2, 65, { align: "center" });

      // === REVENUE SECTION ===
      let yPosition = 78;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("REVENUE", margin, yPosition);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 8;

      doc.autoTable({
        startY: yPosition,
        body: [
          ["Gross Sales", formatCurrency(salesData.grossSales)],
          ["    Less: Discounts", `(${formatCurrency(salesData.discountsAmount)})`],
          ["    Less: Refunds", `(${formatCurrency(salesData.refundsAmount)})`],
        ],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 2;

      // Net Sales summary row
      doc.autoTable({
        startY: yPosition,
        body: [["Net Sales", formatCurrency(salesData.netSales)]],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          fontStyle: "bold",
          fillColor: [245, 245, 245],
          textColor: [30, 30, 30],
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right" },
        },
      });

      // === COST OF SALES ===
      yPosition = (doc as any).lastAutoTable?.finalY + 12;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("COST OF SALES", margin, yPosition);
      doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 8;

      doc.autoTable({
        startY: yPosition,
        body: [["Cost of Goods Sold (COGS)", formatCurrency(salesData.costsAmount)]],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 2;

      doc.autoTable({
        startY: yPosition,
        body: [[`Gross Profit (${grossMargin}% margin)`, formatCurrency(salesData.grossProfit)]],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          fontStyle: "bold",
          fillColor: [236, 253, 245],
          textColor: [21, 128, 61],
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right" },
        },
      });

      // === OPERATING EXPENSES ===
      yPosition = (doc as any).lastAutoTable?.finalY + 12;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("OPERATING EXPENSES", margin, yPosition);
      doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
      yPosition += 8;

      doc.autoTable({
        startY: yPosition,
        body: [["Total Operating Expenses", formatCurrency(salesData.expensesPaidAmount)]],
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3, textColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });

      // === NET PROFIT / LOSS ===
      yPosition = (doc as any).lastAutoTable?.finalY + 8;

      // Double line above net profit
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      doc.setLineWidth(0.2);
      doc.line(margin, yPosition + 1.5, pageWidth - margin, yPosition + 1.5);

      yPosition += 4;

      const isProfit = salesData.netProfit >= 0;
      const netFillColor = isProfit ? [236, 253, 245] : [254, 242, 242];
      const netTextColor = isProfit ? [21, 128, 61] : [220, 38, 38];

      doc.autoTable({
        startY: yPosition,
        body: [
          [
            `${isProfit ? "NET PROFIT" : "NET LOSS"} (Net Margin: ${netMargin}%)`,
            formatCurrency(salesData.netProfit),
          ],
        ],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 12,
          cellPadding: 6,
          fontStyle: "bold",
          fillColor: netFillColor,
          textColor: netTextColor,
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.65 },
          1: { halign: "right" },
        },
      });

      // === FOOTER ===
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;

      // Separator before footer
      const footerSepY = Math.min(finalY + 15, pageHeight - 35);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, footerSepY, pageWidth - margin, footerSepY);

      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.setFont("helvetica", "normal");

      const disclaimerText =
        "This report was generated automatically by the system. Any changes made to the data will not be reflected in this report. Any discrepancies should be reported to the Settlo Team through support@settlo.co.tz.";
      const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);

      const disclaimerStartY = footerSepY + 5;
      disclaimerLines.forEach((line: any, index: any) => {
        doc.text(line, pageWidth / 2, disclaimerStartY + index * 3, { align: "center" });
      });

      const poweredByY = disclaimerStartY + disclaimerLines.length * 3 + 3;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(160, 160, 160);
      doc.text("Powered by Settlo", pageWidth / 2, poweredByY, { align: "center" });

      // Bottom border
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.8);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      // Save
      const startDate = new Date(salesData.startDate);
      const endDate = new Date(salesData.endDate);
      const filename = `profit-loss-statement-${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}-to-${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}.pdf`;

      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross sales
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(salesData.grossSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net sales
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(salesData.netSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross profit
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(salesData.grossProfit)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {grossMargin}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {salesData.netProfit >= 0 ? "Net profit" : "Net loss"}
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {salesData.netProfit >= 0 ? (
                <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div
              className={`text-2xl font-bold ${salesData.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {formatCurrency(salesData.netProfit)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {netMargin}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed statement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Detailed statement
          </CardTitle>
          <Button size="sm" onClick={generatePDF} disabled={downloadingPdf}>
            {downloadingPdf ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1.5" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                Download PDF
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <ReportLetterhead business={business} location={location} />

          {/* Revenue */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Revenue
            </h3>
            <div className="rounded-lg border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Gross sales
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(salesData.grossSales)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-2 pl-6">
                  <RefreshCcw className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">
                    Less: Discounts
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({formatCurrency(salesData.discountsAmount)})
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-2 pl-6">
                  <RefreshCcw className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-muted-foreground">
                    Less: Refunds
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({formatCurrency(salesData.refundsAmount)})
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Net sales
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.netSales)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Cost of sales */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Cost of sales
            </h3>
            <div className="rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Cost of goods sold
                  </span>
                </div>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {formatCurrency(salesData.costsAmount)}
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center rounded-lg bg-green-50 dark:bg-green-950/30 px-4 py-3">
              <div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Gross profit
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {grossMargin}% margin
                </span>
              </div>
              <span className="text-base font-bold text-green-600 dark:text-green-400">
                {formatCurrency(salesData.grossProfit)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Operating expenses */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Operating expenses
            </h3>
            <div className="rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center py-3 px-4">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Total expenses
                  </span>
                </div>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  {formatCurrency(salesData.expensesPaidAmount)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net profit / loss */}
          <div
            className={`flex justify-between items-center rounded-lg p-5 ${
              salesData.netProfit >= 0
                ? "bg-green-50 dark:bg-green-950/30"
                : "bg-red-50 dark:bg-red-950/30"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {salesData.netProfit >= 0 ? "Net profit" : "Net loss"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Net margin: {netMargin}%
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                salesData.netProfit >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(salesData.netProfit)}
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            This report was generated automatically. Any discrepancies should be
            reported to the Settlo Team through support@settlo.co.tz.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossStatement;
