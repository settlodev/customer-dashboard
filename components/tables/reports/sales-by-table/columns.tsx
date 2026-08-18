"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One row of the sales-by-table summary — orders grouped by `tableId`. */
export interface TableSalesRow {
  /** Table (space) id. */
  id: string;
  name: string;
  code: string | null;
  orders: number;
  gross: number;
  net: number;
  profit: number;
}

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

interface BuildColumnsOptions {
  currency: string;
}

export function buildSalesByTableColumns({
  currency,
}: BuildColumnsOptions): ColumnDef<TableSalesRow>[] {
  return [
    {
      accessorKey: "name",
      enableHiding: false,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Table
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-muted-foreground">
              <Utensils className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-ink">{item.name}</span>
              {item.code && (
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {item.code}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "orders",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Orders
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNum(row.original.orders)}</span>
      ),
    },
    {
      accessorKey: "gross",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Gross
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span className="font-medium">{formatNum(row.original.gross)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "net",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Net
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span>{formatNum(row.original.net)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "profit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Profit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const profit = item.profit ?? 0;
        const margin = item.net > 0 ? (profit / item.net) * 100 : null;
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
