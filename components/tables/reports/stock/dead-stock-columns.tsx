"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DeadStockItem } from "@/types/inventory-analytics/type";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

export function buildDeadStockColumns(currency: string): ColumnDef<DeadStockItem>[] {
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
      accessorKey: "quantityOnHand",
      header: "On hand",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatNum(row.original.quantityOnHand, 2)}
        </span>
      ),
    },
    {
      accessorKey: "daysSinceLastMovement",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Days idle
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums text-amber-700 dark:text-amber-400">
          {formatNum(row.original.daysSinceLastMovement)}
        </span>
      ),
    },
    {
      accessorKey: "totalValue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tied-up value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span className="font-medium">
            {formatNum(row.original.totalValue)}
          </span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
  ];
}
