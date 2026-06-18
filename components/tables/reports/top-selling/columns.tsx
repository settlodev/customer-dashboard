"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpDown, ArrowUpRight, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiSparkline } from "@/components/layouts/kpi-strip";
import { cn } from "@/lib/utils";
import type { TopSellingItem } from "@/types/reports/top-selling";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const formatPercent = (value: number | null | undefined, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
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

interface BuildColumnsOptions {
  currency: string;
}

export function buildTopSellingColumns({
  currency,
}: BuildColumnsOptions): ColumnDef<TopSellingItem>[] {
  return [
    {
      accessorKey: "rank",
      enableHiding: false,
      header: "#",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
          {row.original.rank.toString().padStart(2, "0")}
        </span>
      ),
    },
    {
      accessorKey: "productName",
      enableHiding: false,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-canvas">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <Package
                  className="h-4 w-4 text-muted-2"
                  aria-hidden
                  strokeWidth={1.5}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-ink">
                {item.productName}
              </span>
              {item.variantName && (
                <span className="truncate text-[11px] text-muted-foreground">
                  {item.variantName}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      // The Reports read-model carries the product's DEPARTMENT here
      // (`coalesce(category_name, department_name)` ← `product.getDepartmentId()`),
      // not the catalog category taxonomy — so this column is the department.
      accessorKey: "categoryName",
      header: "Department",
      cell: ({ row }) => {
        const name = row.original.categoryName;
        if (!name) return <span className="text-muted-foreground">—</span>;
        return (
          <Badge variant="outline" className="font-normal">
            {name}
          </Badge>
        );
      },
    },
    {
      accessorKey: "quantitySold",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sold
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const refunded = item.refundedQuantity ?? 0;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(item.quantitySold)}</span>
            {refunded > 0 ? (
              <span className="text-[11px] text-rose-600 dark:text-rose-400">
                −{formatNum(refunded)} refunded
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {formatNum(item.ordersCount)} order
                {item.ordersCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "revenue",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Revenue
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const refunded = item.refundAmount ?? 0;
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {formatNum(item.revenue)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {refunded > 0 ? (
                <>
                  Net {formatNum(item.netRevenue)} {currency}
                </>
              ) : (
                currency
              )}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "grossProfit",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Profit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const profit = item.grossProfit ?? 0;
        const margin = item.profitMargin;
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
              {margin === null
                ? "Margin —"
                : `${formatPercent(margin)} margin`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "averagePrice",
      header: "Avg price",
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span>{formatNum(row.original.averagePrice)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "revenueShare",
      header: "Share",
      cell: ({ row }) => {
        const value = row.original.revenueShare ?? 0;
        return (
          <div className="flex w-[88px] flex-col gap-1 tabular-nums">
            <span className="text-[12.5px] font-medium">
              {formatPercent(value)}
            </span>
            <div className="h-1 w-full rounded-full bg-line">
              <div
                className="h-full rounded-full bg-emerald-500/70 dark:bg-emerald-400/60"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: "trend",
      header: "Trend",
      cell: ({ row }) => {
        const series = row.original.trend;
        if (!series || series.length < 2) {
          return <span className="text-muted-foreground">—</span>;
        }
        // KpiSparkline is absolutely positioned; wrap in a relative box
        // so it pins to this cell, not the row card.
        return (
          <div className="relative h-5 w-[72px]">
            <KpiSparkline
              data={series}
              width={72}
              height={20}
              className="bottom-0 right-0 opacity-90"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "lastSoldAt",
      header: "Last sold",
      cell: ({ row }) => {
        const parts = formatDateTime(row.original.lastSoldAt);
        if (!parts) return <span className="text-muted-foreground">—</span>;
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
