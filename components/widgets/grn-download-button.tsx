"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { StockReceipt } from "@/types/stock-intake-receipt/type";
import { toast } from "@/hooks/use-toast";

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
  items,
  totalQuantityReceived,
  totalValue,
}: GRNDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const generatePDF = async () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("GOODS RECEIVED NOTE", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Business: ${receiptData.businessName}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Location: ${receiptData.locationName}`, margin, yPosition);
      yPosition += 6;

      // GRN Number on the right
      doc.setFont("helvetica", "bold");
      doc.text(`GRN No: ${receiptData.receiptNumber}`, pageWidth - margin, 30, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");

      // Meta Information
      yPosition += 5;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Meta data in a table format
      const metaData = [
        ["PO Reference:", receiptData.purchaseOrderNumber || "—"],
        [
          "GRN Date:",
          receiptData.dateReceived
            ? format(new Date(receiptData.dateReceived), "dd-MMM-yyyy")
            : format(new Date(), "dd-MMM-yyyy"),
        ],
        ["Invoice No.:", (receiptData as any).invoiceNumber || "—"],
        [
          "Prepared By:",
          `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
        ],
      ];

      metaData.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 40, yPosition);
        yPosition += 6;
      });

      yPosition += 5;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Supplier and Receiving Location
      // Supplier
      doc.setFont("helvetica", "bold");
      doc.text("SUPPLIER INFORMATION", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 6;

      const supplierInfo = [
        `Supplier: ${receiptData.supplierName}`,
        receiptData.supplierEmail
          ? `Email: ${receiptData.supplierEmail}`
          : null,
        receiptData.supplierPhoneNumber
          ? `Phone: ${receiptData.supplierPhoneNumber}`
          : null,
      ].filter(Boolean);

      supplierInfo.forEach((info) => {
        if (info) {
          doc.text(info, margin, yPosition);
          yPosition += 5;
        }
      });

      // Receiving Location (on the right)
      let rightY = yPosition - supplierInfo.length * 5;
      doc.setFont("helvetica", "bold");
      doc.text("RECEIVING LOCATION", pageWidth - margin, rightY, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      rightY += 6;

      const locationInfo = [
        `Business: ${receiptData.businessName}`,
        `Location: ${receiptData.locationName}`,
        receiptData.locationEmail
          ? `Email: ${receiptData.locationEmail}`
          : null,
        receiptData.locationPhone
          ? `Phone: ${receiptData.locationPhone}`
          : null,
        receiptData.locationAddress
          ? `Address: ${receiptData.locationAddress}`
          : null,
      ].filter(Boolean);

      locationInfo.forEach((info) => {
        if (info) {
          doc.text(info, pageWidth - margin, rightY, { align: "right" });
          rightY += 5;
        }
      });

      yPosition = Math.max(yPosition, rightY) + 10;

      // Items Table
      doc.setFont("helvetica", "bold");
      doc.text("RECEIVED ITEMS", margin, yPosition);
      yPosition += 5;

      const tableData = items.map((item, index) => [
        (index + 1).toString(),
        item.stockName +
          (item.stockVariantName && item.stockVariantName !== item.stockName
            ? `\n${item.stockVariantName}`
            : ""),
        item.quantityReceived?.toLocaleString() || "0",
        item.previousCostPerItem != null
          ? formatCurrency(item.previousCostPerItem)
          : "—",
        item.lastCostPerItem != null
          ? formatCurrency(item.lastCostPerItem)
          : item.previousCostPerItem != null
            ? formatCurrency(item.previousCostPerItem)
            : "—",
        formatCurrency(item.totalCost || 0),
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [["#", "Product Description", "Qty", "CP", "Last CP", "Amount"]],
        body: tableData,
        foot: [
          [
            { content: "Totals", colSpan: 2, styles: { fontStyle: "bold" } },
            {
              content: totalQuantityReceived.toLocaleString(),
              styles: { fontStyle: "bold", halign: "right" },
            },
            { content: "", colSpan: 2 },
            {
              content: formatCurrency(totalValue),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ],
        ],
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 70 },
          2: { cellWidth: 20, halign: "right" },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 20, halign: "right" },
          5: { cellWidth: 25, halign: "right" },
        },
        didDrawPage: (data: any) => {
          // Add footer on each page
          const pageCount = doc.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(
              `Page ${i} of ${pageCount}`,
              pageWidth / 2,
              doc.internal.pageSize.height - 10,
              { align: "center" },
            );
          }
        },
      });

      // Summary Box
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
      yPosition = finalY + 10;

      // Summary on the right
      const summaryX = pageWidth - margin - 80;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(summaryX, yPosition, 80, 50);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("SUMMARY", summaryX + 5, yPosition + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      let summaryY = yPosition + 15;
      const summaryItems = [
        { label: "Net Amount:", value: formatCurrency(totalValue) },
        { label: "VAT Amount:", value: "0.00" },
        { label: "Rounding:", value: "0.00" },
      ];

      summaryItems.forEach((item) => {
        doc.text(item.label, summaryX + 5, summaryY);
        doc.text(item.value, summaryX + 70, summaryY, { align: "right" });
        summaryY += 7;
      });

      // Total
      doc.setFillColor(0, 0, 0);
      doc.rect(summaryX, summaryY - 2, 80, 10, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL AMOUNT:", summaryX + 5, summaryY + 4);
      doc.text(formatCurrency(totalValue), summaryX + 70, summaryY + 4, {
        align: "right",
      });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = summaryY + 15;

      // Signatures
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = 20;
      }

      const signatureData = [
        {
          label: "Prepared By",
          value: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
        },
        { label: "Checked By", value: "" },
        { label: "Authorized By", value: "" },
        { label: "Accounts", value: "" },
      ];

      const sigWidth = (pageWidth - 2 * margin) / 4;
      signatureData.forEach((sig, index) => {
        const x = margin + index * sigWidth;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(x, yPosition, x + sigWidth - 10, yPosition);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(sig.label, x + 5, yPosition + 5);
        if (sig.value) {
          doc.setFont("helvetica", "normal");
          doc.text(sig.value, x + 5, yPosition - 2);
        }
      });

      yPosition += 15;

      // Approval Table and VAT Summary
      const tableWidth = (pageWidth - 3 * margin) / 2;

      // Approval Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("APPROVAL", margin, yPosition);
      yPosition += 3;

      doc.autoTable({
        startY: yPosition,
        head: [["Approved By", "Date", "Amount"]],
        body: [
          ["", "", ""],
          ["", "", ""],
        ],
        margin: { left: margin, right: pageWidth - margin - tableWidth },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          halign: "center",
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
        },
      });

      // VAT Summary Table (on the right)
      const vatX = pageWidth - margin - tableWidth;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("VAT SUMMARY", vatX, yPosition);
      yPosition += 3;

      doc.autoTable({
        startY: yPosition,
        head: [["Type", "VAT", "Goods Value"]],
        body: [
          ["VAT", "0", formatCurrency(totalValue)],
          ["EXEM", "0", "0.00"],
        ],
        margin: { left: vatX, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          lineColor: [0, 0, 0],
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right" },
          2: { halign: "right" },
        },
      });

      // Notes (if any)
      if (receiptData.notes) {
        yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 50;
        yPosition += 10;

        if (yPosition > doc.internal.pageSize.height - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("NOTES", margin, yPosition);
        yPosition += 5;

        doc.setFont("helvetica", "normal");
        const splitNotes = doc.splitTextToSize(
          receiptData.notes,
          pageWidth - 2 * margin,
        );
        doc.text(splitNotes, margin, yPosition);
        yPosition += splitNotes.length * 4;
      }

      // Terms & Conditions
      yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 50;
      yPosition += 10;

      if (yPosition > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TERMS & CONDITIONS", margin, yPosition);
      yPosition += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const terms = [
        "1. This goods receipt note confirms the receipt of items listed above in the specified quantities and conditions.",
        "2. Any discrepancies or damages must be reported within 48 hours of receipt.",
        "3. The receiver confirms that all items have been inspected and meet the required quality standards.",
        "4. This document serves as proof of delivery and acceptance of goods.",
        "5. The supplier's invoice should reference this receipt number for payment processing.",
        "6. Payment will be processed based on quantities received and accepted as per this note.",
      ];

      terms.forEach((term) => {
        const splitTerm = doc.splitTextToSize(term, pageWidth - 2 * margin);
        doc.text(splitTerm, margin, yPosition);
        yPosition += splitTerm.length * 3 + 1;
      });

      // Footer
      yPosition = doc.internal.pageSize.height - 15;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("This is a system-generated document", margin, yPosition);
      doc.text(
        format(new Date(), "dd MMM yyyy, hh:mm:ss a"),
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      doc.text("Powered by Settlo", pageWidth - margin, yPosition, {
        align: "right",
      });

      // Save the PDF
      const filename = `GRN-${receiptData.receiptNumber}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(filename);

      toast({
        title: "PDF Downloaded",
        description: `GRN saved as ${filename}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isDownloading}
      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isDownloading ? "Generating..." : "Download PDF"}
    </button>
  );
}
