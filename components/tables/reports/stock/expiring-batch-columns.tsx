"use client";

import { differenceInCalendarDays } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StockBatch } from "@/types/stock-batch/type";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
};

/**
 * Columns for the "Expiring soon" table.
 *
 * `today` is captured at render-call time so each row computes a
 * stable "days until expiry" relative to the same anchor; without
 * this, two re-renders straddling midnight could disagree on which
 * batches are "due today".
 */
export function buildExpiringBatchColumns(
  currency: string,
  today: Date,
): ColumnDef<StockBatch>[] {
  return [
    {
      accessorKey: "variantName",
      enableHiding: false,
      header: "Item",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-ink">
              {item.variantName}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {item.stockName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "batchNumber",
      header: "Batch",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] tabular-nums text-ink">
          {row.original.batchNumber}
        </span>
      ),
    },
    {
      accessorKey: "quantityOnHand",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          On hand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatNum(row.original.quantityOnHand, 2)}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expires
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const expiry = row.original.expiryDate;
        const label = formatDate(expiry);
        if (!expiry || !label) {
          return <span className="text-muted-foreground">—</span>;
        }
        const days = differenceInCalendarDays(new Date(expiry), today);
        return (
          <div className="flex flex-col">
            <span className="text-[12.5px]">{label}</span>
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                days <= 0
                  ? "text-rose-600 dark:text-rose-400"
                  : days <= 3
                    ? "text-rose-600 dark:text-rose-400"
                    : days <= 7
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground",
              )}
            >
              {days < 0
                ? `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`
                : days === 0
                  ? "Today"
                  : `in ${days} day${days === 1 ? "" : "s"}`}
            </span>
          </div>
        );
      },
    },
    {
      id: "value",
      header: "Tied-up value",
      cell: ({ row }) => {
        const item = row.original;
        const cost = item.unitCost ?? 0;
        const value = item.quantityOnHand * cost;
        if (!cost) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(value)}</span>
            <span className="text-[11px] text-muted-foreground">{currency}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "supplierId",
      header: "Supplier",
      cell: ({ row }) => {
        const id = row.original.supplierId;
        if (!id) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className="font-mono text-[10.5px]">
            {id.slice(0, 8)}
          </Badge>
        );
      },
    },
  ];
}
