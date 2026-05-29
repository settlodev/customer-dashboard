"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RESERVATION_REFERENCE_LABELS,
  RESERVATION_STATUS_CONFIG,
  type StockReservation,
  type StockReservationStatus,
} from "@/types/stock-reservation/type";

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

const STATUS_PILL: Record<StockReservationStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  EXPIRED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  RELEASED: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

export const reservationsColumns: ColumnDef<StockReservation>[] = [
  {
    accessorKey: "stockVariantName",
    enableHiding: false,
    header: "Item",
    cell: ({ row }) => {
      const item = row.original;
      const name = item.stockVariantName ?? "Unnamed variant";
      return (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink">{name}</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {item.stockName ?? "—"}
            {item.stockVariantSku ? ` · ${item.stockVariantSku}` : ""}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatNum(row.original.quantity, 2)}
      </span>
    ),
  },
  {
    accessorKey: "referenceType",
    header: "Reference",
    cell: ({ row }) => {
      const type = row.original.referenceType;
      if (!type) return <span className="text-muted-foreground">—</span>;
      const label = RESERVATION_REFERENCE_LABELS[type] ?? type;
      return (
        <Badge variant="outline" className="font-normal">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "reservedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="text-left p-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Reserved at
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.reservedAt);
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
  {
    accessorKey: "reservationExpiresAt",
    header: "Expires",
    cell: ({ row }) => {
      const parts = formatDateTime(row.original.reservationExpiresAt);
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
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const config = RESERVATION_STATUS_CONFIG[status];
      return (
        <Badge
          variant="outline"
          className={cn("font-normal", STATUS_PILL[status])}
        >
          {config.label}
        </Badge>
      );
    },
  },
];
