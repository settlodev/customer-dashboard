"use client";

import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StaffReportItem } from "@/types/staff";

const formatNum = (value: number | null | undefined, max = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const isValidImage = (url: string | null | undefined) =>
  !!url &&
  (url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/"));

interface BuildColumnsOptions {
  currency: string;
}

export function buildSalesByStaffColumns({
  currency,
}: BuildColumnsOptions): ColumnDef<StaffReportItem>[] {
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
          Staff
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        // Sales can be attributed to an actor id with no staff record (an
        // owner/device/user subject — see resolveActorStaffId on the backend),
        // so the Reports rollup hands us a blank name. Show an honest
        // placeholder rather than an empty cell, and skip the broken avatar.
        const resolved = item.name.trim();
        const displayName = resolved || "Unknown staff";
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-canvas">
              {isValidImage(item.image) ? (
                <Image
                  src={item.image}
                  alt={displayName}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span className="font-mono text-[11px] font-medium text-muted-foreground">
                  {resolved ? initials(resolved) : "—"}
                </span>
              )}
            </div>
            <span
              className={cn(
                "truncate font-medium",
                resolved ? "text-ink" : "italic text-muted-foreground",
              )}
            >
              {displayName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalOrdersCompleted",
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
        <span className="tabular-nums">
          {formatNum(row.original.totalOrdersCompleted)}
        </span>
      ),
    },
    {
      accessorKey: "totalItemsSold",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Items sold
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatNum(row.original.totalItemsSold)}
        </span>
      ),
    },
    {
      accessorKey: "totalGrossAmount",
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
          <span className="font-medium">
            {formatNum(row.original.totalGrossAmount)}
          </span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalNetAmount",
      header: "Net",
      cell: ({ row }) => (
        <div className="flex flex-col tabular-nums">
          <span>{formatNum(row.original.totalNetAmount)}</span>
          <span className="text-[11px] text-muted-foreground">{currency}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalGrossProfit",
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
        const profit = item.totalGrossProfit ?? 0;
        const margin =
          item.totalNetAmount > 0
            ? (profit / item.totalNetAmount) * 100
            : null;
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
