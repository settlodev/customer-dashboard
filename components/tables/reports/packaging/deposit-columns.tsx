"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, PackageOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PackagingReportItem } from "@/types/packaging-report/type";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const CONTAINER_MODE_LABEL: Record<PackagingReportItem["containerMode"], string> = {
  RETURNABLE: "Returnable",
  CONSUMABLE: "Consumed",
};

const CONTAINER_MODE_PILL: Record<PackagingReportItem["containerMode"], string> = {
  RETURNABLE: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  CONSUMABLE:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

interface BuildOptions {
  currency: string;
}

export function buildPackagingDepositColumns({
  currency,
}: BuildOptions): ColumnDef<PackagingReportItem>[] {
  return [
    {
      accessorKey: "variantName",
      enableHiding: false,
      // Search matches both the variant name and its parent stock name, so
      // typing either finds the row (the table searches this column).
      filterFn: (row, _columnId, value) => {
        const q = String(value ?? "").toLowerCase();
        if (!q) return true;
        const item = row.original;
        return (
          (item.variantName ?? "").toLowerCase().includes(q) ||
          (item.stockName ?? "").toLowerCase().includes(q)
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-line bg-canvas">
              <PackageOpen
                className="h-4 w-4 text-muted-2"
                aria-hidden
                strokeWidth={1.5}
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-ink">
                {item.variantName}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {item.stockName}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "containerMode",
      header: "Container",
      cell: ({ row }) => {
        const mode = row.original.containerMode;
        return (
          <Badge
            variant="outline"
            className={cn("font-normal", CONTAINER_MODE_PILL[mode])}
          >
            {CONTAINER_MODE_LABEL[mode]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "depositValue",
      header: "Deposit value",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">
              {formatNum(item.depositValue, 2)}
            </span>
            {item.depositValue !== null && (
              <span className="text-[11px] text-muted-foreground">
                {item.depositCurrency ?? currency}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "quantityOnHand",
      header: "Empties on hand",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatNum(row.original.quantityOnHand, 2)}
        </span>
      ),
    },
    {
      accessorKey: "depositLiability",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Deposit liability
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.original.depositLiability;
        if (!value) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(value, 2)}</span>
            <span className="text-[11px] text-muted-foreground">
              {currency}
            </span>
          </div>
        );
      },
    },
  ];
}
