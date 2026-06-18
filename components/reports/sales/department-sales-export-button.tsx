"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DepartmentProductSale } from "@/components/tables/reports/department-product-sales/columns";

/** Quote a CSV cell only when it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function slugify(name: string): string {
  return (
    name
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "department"
  );
}

interface Props {
  /** The full, unpaginated row set — the export covers everything, not just
   *  the visible page. */
  rows: DepartmentProductSale[];
  departmentName: string;
  currency: string;
  from: string;
  to: string;
}

/**
 * Exports the department's products-in-period table to CSV, client-side. The
 * parent already holds every row in memory (no server pagination), so there's
 * nothing to fetch — we serialise `rows` straight to a download.
 */
export function DepartmentSalesExportButton({
  rows,
  departmentName,
  currency,
  from,
  to,
}: Props) {
  const handleExport = () => {
    const header = [
      "Product",
      "Qty sold",
      `Gross (${currency})`,
      `Discount (${currency})`,
      `Net (${currency})`,
      `COGS (${currency})`,
      `Gross profit (${currency})`,
      "Margin %",
    ];
    const body = rows.map((r) => {
      const margin = r.netSales > 0 ? (r.grossProfit / r.netSales) * 100 : 0;
      return [
        r.name,
        r.quantitySold,
        r.grossSales,
        r.totalDiscount,
        r.netSales,
        r.totalCost,
        r.grossProfit,
        margin.toFixed(1),
      ]
        .map(csvCell)
        .join(",");
    });
    const csv = [header.map(csvCell).join(","), ...body].join("\n");

    // Lead with a BOM so Excel reads UTF-8 without mangling accents.
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${slugify(departmentName)}-sales-${from}_to_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={rows.length === 0}
    >
      <Download className="mr-1.5 h-4 w-4" />
      Export CSV
    </Button>
  );
}
