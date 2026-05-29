"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InventoryBalance } from "@/types/inventory-balance/type";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("en", {
      timeStyle: "short",
      hour12: false,
    }).format(date),
  };
};

type Status = "OUT" | "LOW" | "OVERSTOCK" | "OK";

const STATUS_PILL: Record<Status, string> = {
  OUT: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  LOW: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  OVERSTOCK:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  OK: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
};

const STATUS_LABEL: Record<Status, string> = {
  OUT: "Out",
  LOW: "Low",
  OVERSTOCK: "Overstock",
  OK: "OK",
};

const deriveStatus = (b: InventoryBalance): Status => {
  if (b.outOfStock) return "OUT";
  if (b.lowStock) return "LOW";
  if (b.overstock) return "OVERSTOCK";
  return "OK";
};

interface BuildOptions {
  currency: string;
}

export function buildLevelsColumns({
  currency,
}: BuildOptions): ColumnDef<InventoryBalance>[] {
  return [
    {
      accessorKey: "variantName",
      enableHiding: false,
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
              <Package
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
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(item.quantityOnHand, 2)}</span>
            {item.inTransitQuantity > 0 ? (
              <span className="text-[11px] text-blue-600 dark:text-blue-400">
                +{formatNum(item.inTransitQuantity, 2)} in transit
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "reservedQuantity",
      header: "Reserved",
      cell: ({ row }) => {
        const v = row.original.reservedQuantity;
        if (!v) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="font-mono text-[12.5px] tabular-nums text-amber-700 dark:text-amber-400">
            {formatNum(v, 2)}
          </span>
        );
      },
    },
    {
      accessorKey: "availableQuantity",
      header: "Available",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatNum(row.original.availableQuantity, 2)}
        </span>
      ),
    },
    {
      id: "value",
      header: "Stock value",
      cell: ({ row }) => {
        const item = row.original;
        const cost = item.averageCost ?? item.currentBatchCost ?? 0;
        const value = item.quantityOnHand * cost;
        if (!cost) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(value)}</span>
            <span className="text-[11px] text-muted-foreground">
              {currency} · {formatNum(cost, 2)} avg cost
            </span>
          </div>
        );
      },
    },
    {
      id: "thresholds",
      header: "Thresholds",
      cell: ({ row }) => {
        const { lowStockThreshold: low, overstockThreshold: over } =
          row.original;
        if (low == null && over == null) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-[11.5px] tabular-nums">
            {low != null && (
              <span className="text-muted-foreground">
                Low: <span className="text-ink">{formatNum(low, 2)}</span>
              </span>
            )}
            {over != null && (
              <span className="text-muted-foreground">
                Over: <span className="text-ink">{formatNum(over, 2)}</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = deriveStatus(row.original);
        return (
          <Badge
            variant="outline"
            className={cn("font-normal", STATUS_PILL[status])}
          >
            {STATUS_LABEL[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastMovementAt",
      header: "Last movement",
      cell: ({ row }) => {
        const parts = formatDateTime(row.original.lastMovementAt);
        if (!parts) {
          return <span className="text-muted-foreground">Never</span>;
        }
        return (
          <div className="flex flex-col">
            <span>{parts.date}</span>
            <span className="text-[11px] text-muted-foreground">
              {parts.time}
            </span>
          </div>
        );
      },
    },
  ];
}
