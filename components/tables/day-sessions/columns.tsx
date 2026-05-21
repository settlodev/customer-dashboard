"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DaySessionListItem } from "@/lib/actions/day-session-list-actions";

const STATUS_TONE: Record<string, "pos" | "neg" | "warn" | "soft"> = {
  OPEN: "pos",
  CLOSED: "soft",
  SUPERSEDED: "warn",
  DELETED: "neg",
};

const formatMoney = (amount: number) =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 0 });

const formatDate = (iso: string) => {
  // Render YYYY-MM-DD as the operator's display — businessDate is
  // already in the location's timezone server-side.
  return iso;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (minutes?: number | null) => {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const columns: ColumnDef<DaySessionListItem>[] = [
  {
    accessorKey: "businessDate",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Business day
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/day-sessions/${row.original.sessionId}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {formatDate(row.original.businessDate)}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const reopen = (row.original.isReopen ?? 0) > 0;
      return (
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_TONE[status] ?? "soft"}>{status}</Badge>
          {reopen ? (
            <span className="text-[10px] uppercase tracking-wide text-amber-600">
              reopen
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "triggerType",
    header: "Trigger",
    cell: ({ row }) => (
      <span className="text-xs text-gray-600">{row.original.triggerType}</span>
    ),
  },
  {
    accessorKey: "openedAt",
    header: "Opened",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs">{formatDateTime(row.original.openedAt)}</span>
        {row.original.openedByLabel ? (
          <span className="text-[10px] text-gray-500">
            {row.original.openedByLabel}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "closedAt",
    header: "Closed",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs">{formatDateTime(row.original.closedAt)}</span>
        {row.original.closedByLabel ? (
          <span className="text-[10px] text-gray-500">
            {row.original.closedByLabel}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "durationMinutes",
    header: "Duration",
    cell: ({ row }) => (
      <span className="text-xs">
        {formatDuration(row.original.durationMinutes)}
      </span>
    ),
  },
  {
    accessorKey: "orderCount",
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Orders
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.orderCount}</span>
    ),
  },
  {
    accessorKey: "netSales",
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Net sales
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatMoney(row.original.netSales)}</span>
    ),
  },
  {
    accessorKey: "refundAmount",
    header: "Refunds",
    cell: ({ row }) => {
      const count = row.original.refundCount;
      if (!count) return <span className="text-xs text-gray-400">—</span>;
      return (
        <div className="flex flex-col">
          <span className="text-xs">{formatMoney(row.original.refundAmount)}</span>
          <span className="text-[10px] text-gray-500">
            {count} refund{count === 1 ? "" : "s"}
          </span>
        </div>
      );
    },
  },
];
