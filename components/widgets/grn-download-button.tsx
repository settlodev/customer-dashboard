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

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [16, 163, 127] as [number, number, number],
  accentLight: [236, 253, 245] as [number, number, number],
  gray50: [249, 250, 251] as [number, number, number],
  gray100: [243, 244, 246] as [number, number, number],
  gray200: [229, 231, 235] as [number, number, number],
  gray400: [156, 163, 175] as [number, number, number],
  gray500: [158, 158, 158] as [number, number, number],
  gray600: [75, 85, 99] as [number, number, number],
  gray700: [55, 65, 81] as [number, number, number],
};

export function GRNDownloadButton({
  receiptData,
  items,
  totalQuantityReceived,
  totalValue,
}: GRNDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const fmt = (v: number) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const generatePDF = async () => {
    setIsDownloading(true);

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const PW = doc.internal.pageSize.width;
      const PH = doc.internal.pageSize.height;
      const ML = 15;
      const MR = 15;
      const CW = PW - ML - MR;

      // ── helpers ──────────────────────────────────────────────────────────────
      const setColor = (rgb: [number, number, number]) =>
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      const setFill = (rgb: [number, number, number]) =>
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      const setDraw = (rgb: [number, number, number]) =>
        doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

      const label = (
        text: string,
        x: number,
        y: number,
        opts?: { align?: "left" | "right" | "center" },
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        setColor(C.gray400);
        doc.text(text.toUpperCase(), x, y, { align: opts?.align ?? "left" });
      };

      const value = (
        text: string,
        x: number,
        y: number,
        opts?: { align?: "left" | "right" | "center"; size?: number },
      ) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(opts?.size ?? 9);
        setColor(C.gray700);
        doc.text(text, x, y, { align: opts?.align ?? "left" });
      };

      const boldValue = (
        text: string,
        x: number,
        y: number,
        opts?: { align?: "left" | "right" | "center"; size?: number },
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(opts?.size ?? 9);
        setColor(C.black);
        doc.text(text, x, y, { align: opts?.align ?? "left" });
      };

      // ── HEADER BAND ──────────────────────────────────────────────────────────
      const HEADER_H = 20;
      setFill(C.black);
      doc.rect(0, 0, PW, HEADER_H, "F");

      // Business name (small, top)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setColor(C.accent);
      doc.text((receiptData.businessName ?? "").toUpperCase(), ML, 6);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      setColor(C.white);
      doc.text("GOODS RECEIVED NOTE", ML, 15);

      // GRN badge (right side) — compact
      const grnLabel = "GRN No.";
      const grnNumber = receiptData.receiptNumber;
      setFill(C.accent);
      doc.roundedRect(PW - MR - 46, 3, 46, 14, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setColor(C.accentLight);
      doc.text(grnLabel, PW - MR - 23, 8, { align: "center" });
      doc.setFontSize(8.5);
      setColor(C.white);
      doc.text(grnNumber, PW - MR - 23, 14, { align: "center" });

      // ── META ROW ─────────────────────────────────────────────────────────────
      let y = 30;

      const metaFields = [
        { lbl: "PO Reference", val: receiptData.purchaseOrderNumber || "—" },
        {
          lbl: "GRN Date",
          val: receiptData.dateReceived
            ? format(new Date(receiptData.dateReceived), "dd-MMM-yyyy")
            : format(new Date(), "dd-MMM-yyyy"),
        },
        { lbl: "Invoice No.", val: (receiptData as any).invoiceNumber || "—" },
        {
          lbl: "Prepared By",
          val: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
        },
      ];

      const colW = CW / 4;
      setFill(C.gray50);
      setDraw(C.gray200);
      doc.setLineWidth(0.2);
      doc.roundedRect(ML, y - 5, CW, 18, 2, 2, "FD");

      metaFields.forEach(({ lbl, val }, i) => {
        const x = ML + i * colW + 4;
        label(lbl, x, y);
        boldValue(val, x, y + 7, { size: 8.5 });
      });

      // ── SECTION: SUPPLIER & RECEIVING ────────────────────────────────────────
      y += 22;

      const sectionTitle = (text: string, x: number, yy: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(C.accent);
        doc.text(text.toUpperCase(), x, yy);
        setDraw(C.gray200);
        doc.setLineWidth(0.3);
        doc.line(x, yy + 1.5, x + 82, yy + 1.5);
      };

      const halfW = (CW - 8) / 2;

      // Left card — Supplier
      setFill(C.white);
      setDraw(C.gray200);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, y, halfW, 38, 2, 2, "FD");

      sectionTitle("Supplier Information", ML + 4, y + 7);

      const supRows = [
        { k: "Supplier", v: receiptData.supplierName ?? "" },
        ...(receiptData.supplierEmail
          ? [{ k: "Email", v: receiptData.supplierEmail }]
          : []),
        ...(receiptData.supplierPhoneNumber
          ? [{ k: "Phone", v: receiptData.supplierPhoneNumber }]
          : []),
      ];
      let sy = y + 14;
      supRows.forEach(({ k, v }) => {
        label(k, ML + 4, sy);
        value(v ?? "", ML + 24, sy, { size: 8 });
        sy += 7;
      });

      // Right card — Receiving Location
      const rx = ML + halfW + 8;
      setFill(C.white);
      doc.roundedRect(rx, y, halfW, 38, 2, 2, "FD");

      sectionTitle("Receiving Location", rx + 4, y + 7);

      const locRows = [
        { k: "Business", v: receiptData.businessName ?? "" },
        { k: "Location", v: receiptData.locationName ?? "" },
        ...(receiptData.locationEmail
          ? [{ k: "Email", v: receiptData.locationEmail }]
          : []),
        ...(receiptData.locationPhone
          ? [{ k: "Phone", v: receiptData.locationPhone }]
          : []),
        ...(receiptData.locationAddress
          ? [{ k: "Address", v: receiptData.locationAddress }]
          : []),
      ];
      let ry2 = y + 14;
      locRows.slice(0, 4).forEach(({ k, v }) => {
        label(k, rx + 4, ry2);
        value(v ?? "", rx + 24, ry2, { size: 8 });
        ry2 += 7;
      });

      // ── RECEIVED ITEMS TABLE ──────────────────────────────────────────────────
      y += 46;

      // Section header strip
      setFill(C.black);
      doc.rect(ML, y, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.white);
      doc.text("RECEIVED ITEMS", ML + 3, y + 4.8);

      y += 9;

      const tableData = items.map((item, idx) => [
        (idx + 1).toString(),
        item.stockName +
          (item.stockVariantName && item.stockVariantName !== item.stockName
            ? `\n${item.stockVariantName}`
            : ""),
        item.quantityReceived?.toLocaleString() || "0",
        item.previousCostPerItem != null ? fmt(item.previousCostPerItem) : "—",
        item.lastCostPerItem != null
          ? fmt(item.lastCostPerItem)
          : item.previousCostPerItem != null
            ? fmt(item.previousCostPerItem)
            : "—",
        fmt(item.totalCost || 0),
      ]);

      (doc as any).autoTable({
        startY: y,
        head: [
          [
            "#",
            "Product Description",
            "Qty",
            "Cost Price",
            "Last Cost",
            "Amount",
          ],
        ],
        body: tableData,
        foot: [
          [
            {
              content: "TOTALS",
              colSpan: 2,
              styles: { fontStyle: "bold", halign: "left" },
            },
            {
              content: totalQuantityReceived.toLocaleString(),
              styles: { fontStyle: "bold", halign: "right" },
            },
            { content: "", colSpan: 2 },
            {
              content: fmt(totalValue),
              styles: { fontStyle: "bold", halign: "right" },
            },
          ],
        ],
        margin: { left: ML, right: MR },
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
          lineColor: C.gray200,
          lineWidth: 0.2,
          textColor: C.gray700,
          font: "helvetica",
        },
        headStyles: {
          fillColor: C.gray100,
          textColor: C.gray600,
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
          lineColor: C.gray200,
          lineWidth: 0.3,
        },
        footStyles: {
          fillColor: C.accentLight,
          textColor: C.black,
          fontStyle: "bold",
          fontSize: 8.5,
          lineColor: C.accent,
          lineWidth: 0.4,
        },
        alternateRowStyles: { fillColor: C.gray50 },
        columnStyles: {
          0: { cellWidth: 9, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 72 },
          2: { cellWidth: 22, halign: "right" },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 27, halign: "right", fontStyle: "bold" },
        },
        didDrawPage: () => {
          // page footer — emerald band
          const pg = (doc as any).internal.getCurrentPageInfo().pageNumber;
          // page number just above the footer band
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          setColor(C.gray400);
          doc.text(`Page ${pg}`, PW / 2, PH - 12, { align: "center" });
          // emerald footer band
          setFill(C.accent);
          doc.rect(0, PH - 9, PW, 9, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          setColor(C.white);
          doc.text("This is a system-generated document", ML, PH - 3);
          doc.text(
            format(new Date(), "dd MMM yyyy, hh:mm:ss a"),
            PW / 2,
            PH - 3,
            { align: "center" },
          );
          doc.setFont("helvetica", "bold");
          doc.text("Powered by Settlo", PW - MR, PH - 3, { align: "right" });
        },
      });

      // ── SUMMARY BOX ──────────────────────────────────────────────────────────
      let finalY = (doc as any).lastAutoTable?.finalY ?? y + 60;
      finalY += 8;

      const sumW = 72;
      const sumX = PW - MR - sumW;
      const sumRows = [
        { lbl: "Net Amount", val: fmt(totalValue) },
        { lbl: "VAT Amount", val: "0.00" },
        { lbl: "Rounding Amount", val: "0.00" },
      ];

      // Summary card
      setFill(C.white);
      setDraw(C.gray200);
      doc.setLineWidth(0.3);
      doc.roundedRect(
        sumX,
        finalY,
        sumW,
        8 + sumRows.length * 8 + 10,
        2,
        2,
        "FD",
      );

      // Summary header
      setFill(C.gray100);
      doc.roundedRect(sumX, finalY, sumW, 7, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setColor(C.gray600);
      doc.text("SUMMARY", sumX + sumW / 2, finalY + 5, { align: "center" });

      let sy2 = finalY + 13;
      sumRows.forEach(({ lbl, val }) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(C.gray600);
        doc.text(lbl, sumX + 4, sy2);
        doc.setFont("helvetica", "bold");
        setColor(C.gray700);
        doc.text(val, sumX + sumW - 4, sy2, { align: "right" });

        // divider
        setDraw(C.gray200);
        doc.setLineWidth(0.2);
        doc.line(sumX + 2, sy2 + 2, sumX + sumW - 2, sy2 + 2);
        sy2 += 8;
      });

      // Total row
      setFill(C.accent);
      doc.roundedRect(sumX, sy2 - 2, sumW, 10, 0, 0, "F");
      doc.roundedRect(sumX, sy2 - 2, sumW, 10, 2, 2, "F"); // re-draw with rounded bottom only
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.white);
      doc.text("TOTAL AMOUNT", sumX + 4, sy2 + 4.5);
      doc.setFontSize(9.5);
      doc.text(fmt(totalValue), sumX + sumW - 4, sy2 + 4.5, { align: "right" });

      // ── SIGNATURES ───────────────────────────────────────────────────────────
      let sigY = finalY + 8 + sumRows.length * 8 + 18;

      if (sigY > PH - 70) {
        doc.addPage();
        sigY = 20;
      }

      // Section header strip
      setFill(C.gray100);
      setDraw(C.gray200);
      doc.setLineWidth(0.3);
      doc.rect(ML, sigY, CW, 7, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.gray600);
      doc.text("AUTHORISATION & SIGNATURES", ML + 3, sigY + 4.8);

      sigY += 13;

      const sigBoxes = [
        {
          lbl: "Prepared By",
          val: `${receiptData.staffFirstName} ${receiptData.staffLastName}`,
        },
        { lbl: "Checked By", val: "" },
        { lbl: "Authorised By", val: "" },
        { lbl: "Accounts", val: "" },
      ];
      const sw = CW / 4;

      sigBoxes.forEach(({ lbl, val }, i) => {
        const x = ML + i * sw;
        const lineX1 = x + 3;
        const lineX2 = x + sw - 6;
        const midX = (lineX1 + lineX2) / 2;

        // Pre-filled name (if any) above the line
        if (val) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          setColor(C.gray700);
          doc.text(val, midX, sigY + 10, {
            align: "center",
            maxWidth: sw - 10,
          });
        }

        // Signature line — solid
        setDraw(C.gray600);
        doc.setLineWidth(0.4);
        doc.line(lineX1, sigY + 14, lineX2, sigY + 14);

        // Label below the line
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        setColor(C.gray500 ?? C.gray600);
        doc.text(lbl, midX, sigY + 19, { align: "center" });
      });

      // ── APPROVAL + VAT SUMMARY ────────────────────────────────────────────────
      sigY += 30;

      if (sigY > PH - 60) {
        doc.addPage();
        sigY = 20;
      }

      const tblHalfW = (CW - 8) / 2;

      // Approval
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.gray600);
      doc.text("APPROVAL", ML, sigY);
      sigY += 3;

      (doc as any).autoTable({
        startY: sigY,
        head: [["Approved By", "Date", "Amount"]],
        body: [
          ["", "", ""],
          ["", "", ""],
        ],
        margin: { left: ML, right: PW - ML - tblHalfW },
        styles: {
          fontSize: 8,
          cellPadding: 5,
          halign: "center",
          lineColor: C.gray200,
          lineWidth: 0.2,
          textColor: C.gray700,
        },
        headStyles: {
          fillColor: C.gray100,
          textColor: C.gray600,
          fontStyle: "bold",
          fontSize: 7,
          lineColor: C.gray200,
          lineWidth: 0.3,
        },
        tableLineColor: C.gray200,
        tableLineWidth: 0.2,
      });

      // VAT Summary (right column)
      const vtX = ML + tblHalfW + 8;
      const vtY = sigY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.gray600);
      doc.text("VAT SUMMARY", vtX, vtY);

      (doc as any).autoTable({
        startY: vtY + 3,
        head: [["Type", "VAT", "Goods Value"]],
        body: [
          ["VAT", "0", fmt(totalValue)],
          ["EXEM", "0", "0.00"],
        ],
        margin: { left: vtX, right: MR },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          lineColor: C.gray200,
          lineWidth: 0.2,
          textColor: C.gray700,
        },
        headStyles: {
          fillColor: C.gray100,
          textColor: C.gray600,
          fontStyle: "bold",
          fontSize: 7,
          lineColor: C.gray200,
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold" },
          1: { halign: "right" },
          2: { halign: "right", fontStyle: "bold" },
        },
        tableLineColor: C.gray200,
        tableLineWidth: 0.2,
      });

      // ── NOTES ────────────────────────────────────────────────────────────────
      if (receiptData.notes) {
        let notesY = (doc as any).lastAutoTable?.finalY ?? sigY + 40;
        notesY += 10;

        if (notesY > PH - 40) {
          doc.addPage();
          notesY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        setColor(C.gray600);
        doc.text("NOTES", ML, notesY);
        notesY += 4;

        setFill(C.gray50);
        setDraw(C.gray200);
        doc.setLineWidth(0.3);
        const noteLines = doc.splitTextToSize(receiptData.notes, CW - 8);
        doc.roundedRect(ML, notesY, CW, noteLines.length * 4.5 + 6, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        setColor(C.gray700);
        doc.text(noteLines, ML + 4, notesY + 5);
      }

      // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
      let termsY = (doc as any).lastAutoTable?.finalY ?? sigY + 60;
      termsY += 10;

      if (termsY > PH - 55) {
        doc.addPage();
        termsY = 20;
      }

      setFill(C.gray50);
      setDraw(C.gray200);
      doc.setLineWidth(0.3);
      doc.roundedRect(ML, termsY, CW, 44, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C.gray600);
      doc.text("TERMS & CONDITIONS", ML + 4, termsY + 6);

      const terms = [
        "1. This goods receipt note confirms the receipt of items listed above in the specified quantities and conditions.",
        "2. Any discrepancies or damages must be reported within 48 hours of receipt.",
        "3. The receiver confirms that all items have been inspected and meet the required quality standards.",
        "4. This document serves as proof of delivery and acceptance of goods.",
        "5. The supplier's invoice should reference this receipt number for payment processing.",
        "6. Payment will be processed based on quantities received and accepted as per this note.",
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setColor(C.gray700);
      let ty = termsY + 12;
      terms.forEach((term) => {
        const lines = doc.splitTextToSize(term, CW - 8);
        doc.text(lines, ML + 4, ty);
        ty += lines.length * 4 + 1.5;
      });

      // ── SAVE ──────────────────────────────────────────────────────────────────
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
