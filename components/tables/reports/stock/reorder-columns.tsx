"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ReorderSuggestion } from "@/types/inventory-analytics/type";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

export const reorderColumns: ColumnDef<ReorderSuggestion>[] = [
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
    accessorKey: "currentAvailableQuantity",
    header: "Available",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatNum(row.original.currentAvailableQuantity, 2)}
      </span>
    ),
  },
  {
    accessorKey: "reorderPoint",
    header: "Reorder at",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatNum(row.original.reorderPoint, 2)}
      </span>
    ),
  },
  {
    accessorKey: "avgDailyConsumption",
    header: "Daily use",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNum(row.original.avgDailyConsumption, 2)}
      </span>
    ),
  },
  {
    accessorKey: "daysOfStockRemaining",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Days left
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatNum(row.original.daysOfStockRemaining, 1)}
      </span>
    ),
  },
  {
    accessorKey: "suggestedOrderQuantity",
    header: "Suggested order",
    cell: ({ row }) => (
      <div className="inline-flex items-center gap-1.5 font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
        <PackagePlus className="h-3.5 w-3.5" />
        {formatNum(row.original.suggestedOrderQuantity, 2)}
      </div>
    ),
  },
];
