import React, { useState } from "react";
import { FileText, Calendar, Download, Printer } from "lucide-react";
import SummaryResponse from "@/types/dashboard/type";
import { Location } from "@/types/location/type";

const ProfitLossStatement = ({
  salesData,
  location,
}: {
  salesData: SummaryResponse;
  location: Location;
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const formatCurrency = (value: any) => {
    if (value === undefined || value === null) return "TZS 0.00";
    return `TZS ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate percentages
  const grossMargin = salesData.netSales
    ? ((salesData.grossProfit / salesData.netSales) * 100).toFixed(1)
    : 0;
  const netMargin = salesData.netSales
    ? ((salesData.netProfit / salesData.netSales) * 100).toFixed(1)
    : 0;

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = async () => {
    if (!salesData) {
      alert("No data available to generate PDF");
      return;
    }

    setDownloadingPdf(true);

    try {
      // Dynamic import for jsPDF
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Profit & Loss Statement", margin, 30);

      // Location Details (Right side)
      if (location) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const rightMargin = pageWidth - margin;
        let yPos = 30;

        doc.setFont("helvetica", "bold");
        doc.text(location.name || "", rightMargin, yPos, { align: "right" });
        yPos += 5;

        if (location.address) {
          doc.setFont("helvetica", "normal");
          const addressLines = doc.splitTextToSize(location.address, 80);
          addressLines.forEach((line: any) => {
            doc.text(line, rightMargin, yPos, { align: "right" });
            yPos += 5;
          });
        }

        if (location.phone) {
          doc.text(`Phone: ${location.phone}`, rightMargin, yPos, {
            align: "right",
          });
          yPos += 5;
        }

        if (location.email) {
          doc.text(`Email: ${location.email}`, rightMargin, yPos, {
            align: "right",
          });
        }
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Financial Performance Report", margin, 38);

      doc.setFontSize(10);
      const dateRange = `Period: ${formatDateTime(salesData.startDate)} - ${formatDateTime(salesData.endDate)}`;
      doc.text(dateRange, margin, 50);

      const now = new Date();
      const genDate = `Generated: ${formatDateTime(now.toISOString())}`;
      doc.text(genDate, margin, 57);

      // Revenue Section
      let yPosition = 75;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("REVENUE", margin, yPosition);
      yPosition += 8;

      const revenueData = [
        ["Gross Sales", formatCurrency(salesData.grossSales)],
        ["Less: Discounts", `(${formatCurrency(salesData.discountsAmount)})`],
        ["Less: Refunds", `(${formatCurrency(salesData.refundsAmount)})`],
      ];

      doc.autoTable({
        startY: yPosition,
        body: revenueData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 5;

      doc.autoTable({
        startY: yPosition,
        body: [["Net Sales", formatCurrency(salesData.netSales)]],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 11,
          cellPadding: 4,
          fontStyle: "bold",
          fillColor: [219, 234, 254],
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right" },
        },
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 15;

      // Cost of Sales Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("COST OF SALES", margin, yPosition);
      yPosition += 8;

      const costData = [
        ["Cost Of Goods Sold", formatCurrency(salesData.costsAmount)],
      ];

      doc.autoTable({
        startY: yPosition,
        body: costData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right", fontStyle: "bold", textColor: [220, 38, 38] },
        },
        theme: "plain",
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 5;

      doc.autoTable({
        startY: yPosition,
        body: [
          [
            `Gross Profit (Margin: ${grossMargin}%)`,
            formatCurrency(salesData.grossProfit),
          ],
        ],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 11,
          cellPadding: 4,
          fontStyle: "bold",
          fillColor: [220, 252, 231],
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right", textColor: [21, 128, 61] },
        },
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 15;

      // Operating Expenses Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("OPERATING EXPENSES", margin, yPosition);
      yPosition += 8;

      const expenseData = [
        ["Total Expenses", formatCurrency(salesData.expensesPaidAmount)],
      ];

      doc.autoTable({
        startY: yPosition,
        body: expenseData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right", fontStyle: "bold" },
        },
        theme: "plain",
      });

      yPosition = (doc as any).lastAutoTable?.finalY + 15;

      // Net Profit Section
      const netProfitColor =
        salesData.netProfit >= 0 ? [220, 252, 231] : [254, 226, 226];
      const netProfitTextColor =
        salesData.netProfit >= 0 ? [21, 128, 61] : [220, 38, 38];

      doc.autoTable({
        startY: yPosition,
        body: [
          [
            `${salesData.netProfit >= 0 ? "Net Profit" : "Net Loss"} (Net Margin: ${netMargin}%)`,
            formatCurrency(salesData.netProfit),
          ],
        ],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 13,
          cellPadding: 6,
          fontStyle: "bold",
          fillColor: netProfitColor,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: "right", textColor: netProfitTextColor },
        },
      });

      // FIXED: Calculate final position and ensure everything fits on one page
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;

      // Calculate available space for footer
      const footerStartY = Math.min(finalY + 20, pageHeight - 40);

      // Footer disclaimer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const disclaimerText =
        "This report was generated automatically by the system. Any changes made to the data will not be reflected in this report and any discrepancies should be reported to the Settlo Team through support@settlo.co.tz.";

      const maxWidth = pageWidth - 2 * margin;
      const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);

      const lineHeight = 3;
      const disclaimerHeight = disclaimerLines.length * lineHeight;
      const poweredByHeight = lineHeight;

      // Check if we need to adjust footer position to fit on page
      let footerY = footerStartY;
      if (footerY + disclaimerHeight + poweredByHeight > pageHeight - margin) {
        footerY = pageHeight - margin - disclaimerHeight - poweredByHeight - 5;
      }

      disclaimerLines.forEach((line: any, index: any) => {
        const textWidth = doc.getTextWidth(line);
        const centerX = (pageWidth - textWidth) / 2;
        doc.text(line, centerX, footerY + index * lineHeight);
      });

      const poweredByText = "Powered by Settlo";
      const poweredByWidth = doc.getTextWidth(poweredByText);
      const poweredByCenterX = (pageWidth - poweredByWidth) / 2;
      const poweredByY = footerY + disclaimerHeight + 2;

      doc.text(poweredByText, poweredByCenterX, poweredByY);

      const startDate = new Date(salesData.startDate);
      const endDate = new Date(salesData.endDate);
      const filename = `profit-loss-statement-${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}-to-${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, "0")}-${endDate.getDate().toString().padStart(2, "0")}.pdf`;

      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 py-4 md:py-8 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mb-4 md:mb-6 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-medium">Print</span>
          </button>
          <button
            onClick={generatePDF}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                <span className="font-medium">Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Statement Container */}
        <div
          id="profit-loss-statement"
          className="bg-white shadow-lg rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-3 sm:px-6 md:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold">
                  Profit & Loss Statement
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5 sm:mt-1 hidden sm:block">
                  Financial Performance Report
                </p>
              </div>
            </div>
          </div>

          {/* Date Range Info */}
          <div className="bg-blue-50 px-3 sm:px-6 md:px-8 py-2.5 sm:py-4 border-b border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                <span className="font-medium">Period:</span>
                <span className="break-all">
                  {formatDateTime(salesData.startDate)} -{" "}
                  {formatDateTime(salesData.endDate)}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                Generated{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
            {/* Revenue Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-3 sm:mb-4 pb-2 border-b-2 border-gray-300 uppercase tracking-wide">
                Revenue
              </h2>
              <div className="space-y-1">
                <div className="flex justify-between py-2 sm:py-2.5 hover:bg-gray-50 px-2 sm:px-4 rounded text-xs sm:text-sm md:text-base">
                  <span className="text-gray-700">Gross Sales</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatCurrency(salesData.grossSales)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm">
                  <span className="text-gray-600 pl-3 sm:pl-6">
                    Less: Discounts
                  </span>
                  <span className="text-gray-700 text-right">
                    ({formatCurrency(salesData.discountsAmount)})
                  </span>
                </div>
                <div className="flex justify-between py-1.5 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm">
                  <span className="text-gray-600 pl-3 sm:pl-6">
                    Less: Refunds
                  </span>
                  <span className="text-gray-700 text-right">
                    ({formatCurrency(salesData.refundsAmount)})
                  </span>
                </div>
                <div className="flex justify-between py-2.5 sm:py-3 mt-2 sm:mt-3 pt-3 sm:pt-4 border-t-2 border-gray-400 px-2 sm:px-4 bg-blue-50 rounded">
                  <span className="font-bold text-gray-800 text-xs sm:text-sm md:text-base">
                    Net Sales
                  </span>
                  <span className="font-bold text-blue-700 text-sm sm:text-base md:text-lg text-right">
                    {formatCurrency(salesData.netSales)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Sales Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-3 sm:mb-4 pb-2 border-b-2 border-gray-300 uppercase tracking-wide">
                Cost of Sales
              </h2>
              <div className="space-y-1">
                <div className="flex justify-between py-2 sm:py-2.5 hover:bg-gray-50 px-2 sm:px-4 rounded text-xs sm:text-sm md:text-base">
                  <span className="text-gray-700">Cost Of Goods Sold</span>
                  <span className="font-semibold text-red-600 text-right">
                    {formatCurrency(salesData.costsAmount)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 py-3 sm:py-4 mt-2 sm:mt-3 pt-3 sm:pt-4 border-t-2 border-gray-400 px-2 sm:px-4 bg-green-50 rounded">
                  <div>
                    <span className="font-bold text-gray-800 block text-xs sm:text-sm md:text-base">
                      Gross Profit
                    </span>
                    <span className="text-xs text-green-700 font-medium">
                      Gross Margin: {grossMargin}%
                    </span>
                  </div>
                  <span className="font-bold text-green-700 text-sm sm:text-base md:text-lg text-right sm:text-left">
                    {formatCurrency(salesData.grossProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-3 sm:mb-4 pb-2 border-b-2 border-gray-300 uppercase tracking-wide">
                Operating Expenses
              </h2>
              <div className="space-y-1">
                <div className="flex justify-between py-2 sm:py-2.5 hover:bg-gray-50 px-2 sm:px-4 rounded text-xs sm:text-sm md:text-base">
                  <span className="text-gray-700">Total Expenses</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {formatCurrency(salesData.expensesPaidAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit Section */}
            <div className="pt-4 sm:pt-6 border-t-4 border-gray-800">
              <div
                className={`${salesData.netProfit >= 0 ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-gradient-to-r from-red-50 to-orange-50"} p-4 sm:p-6 rounded-lg border-2 ${salesData.netProfit >= 0 ? "border-green-200" : "border-red-200"}`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                  <div>
                    <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800 block mb-1">
                      {salesData.netProfit >= 0 ? "Net Profit" : "Net Loss"}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-medium ${salesData.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      Net Margin: {netMargin}%
                    </span>
                  </div>
                  <span
                    className={`text-2xl sm:text-3xl md:text-4xl font-bold ${salesData.netProfit >= 0 ? "text-green-700" : "text-red-700"} text-left sm:text-right break-all`}
                  >
                    {formatCurrency(salesData.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                This report was generated automatically by the system. Any
                changes made to the data will not be reflected in this report
                and any discrepancies should be reported to the Settlo Team
                through support@settlo.co.tz.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfitLossStatement;
