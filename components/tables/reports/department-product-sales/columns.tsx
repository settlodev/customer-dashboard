"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpDown, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Per-product sales for one department over the selected range. */
export interface DepartmentProductSale {
  productId: string;
  name: string;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalCost: number;
  grossProfit: number;
  totalDiscount: number;
}

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

/** Sortable, ghost-button column header (matches the other report tables). */
const sortable =
  (label: string): ColumnDef<DepartmentProductSale>["header"] =>
  ({ column }) => (
    <Button
      variant="ghost"
      className="p-0 text-left"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

interface BuildColumnsOptions {
  currency: string;
}

export function buildDepartmentProductSalesColumns({
  currency,
}: BuildColumnsOptions): ColumnDef<DepartmentProductSale>[] {
  return [
    {
      accessorKey: "name",
      enableHiding: false,
      header: sortable("Product"),
      cell: ({ row }) => (
        <span className="block min-w-0 truncate font-medium text-ink">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "quantitySold",
      header: sortable("Qty sold"),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNum(row.original.quantitySold)}
        </span>
      ),
    },
    {
      accessorKey: "grossSales",
      header: sortable("Gross"),
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span className="font-medium">
            {formatNum(row.original.grossSales)}
          </span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalDiscount",
      header: sortable("Discount"),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {row.original.totalDiscount > 0
            ? formatNum(row.original.totalDiscount)
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "netSales",
      header: sortable("Net"),
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span>{formatNum(row.original.netSales)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalCost",
      header: sortable("COGS"),
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatNum(row.original.totalCost)}
        </span>
      ),
    },
    {
      accessorKey: "grossProfit",
      header: sortable("Profit"),
      cell: ({ row }) => {
        const item = row.original;
        const profit = item.grossProfit ?? 0;
        const margin = item.netSales > 0 ? (profit / item.netSales) * 100 : null;
        const positive = profit >= 0;
        return (
          <div className="flex flex-col tabular-nums">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                positive
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
              )}
              {formatNum(Math.abs(profit))}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {margin === null ? "Margin —" : `${margin.toFixed(1)}% margin`}
            </span>
          </div>
        );
      },
    },
  ];
}
