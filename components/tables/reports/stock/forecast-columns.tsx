"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RISK_LEVEL_CONFIG,
  type StockoutForecastItem,
} from "@/types/inventory-analytics/type";

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

export const forecastColumns: ColumnDef<StockoutForecastItem>[] = [
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
    accessorKey: "currentQuantity",
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
        {formatNum(row.original.currentQuantity, 2)}
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
    accessorKey: "daysUntilStockout",
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
    cell: ({ row }) => {
      const days = row.original.daysUntilStockout;
      if (days === null || days === undefined || Number.isNaN(days)) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span
          className={cn(
            "font-medium tabular-nums",
            days <= 3
              ? "text-rose-700 dark:text-rose-400"
              : days <= 7
                ? "text-amber-700 dark:text-amber-400"
                : "text-ink",
          )}
        >
          {days}
        </span>
      );
    },
  },
  {
    accessorKey: "estimatedStockoutDate",
    header: "Out by",
    cell: ({ row }) => {
      const label = formatDate(row.original.estimatedStockoutDate);
      if (!label) return <span className="text-muted-foreground">—</span>;
      return <span className="text-[12.5px]">{label}</span>;
    },
  },
  {
    accessorKey: "riskLevel",
    header: "Risk",
    cell: ({ row }) => {
      const config = RISK_LEVEL_CONFIG[row.original.riskLevel];
      return (
        <Badge
          variant="outline"
          className={cn("font-normal", config.bgColor, config.color)}
        >
          {config.label}
        </Badge>
      );
    },
  },
];
