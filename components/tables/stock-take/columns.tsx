"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  StockTake,
  STOCK_TAKE_STATUS_LABELS,
  STOCK_TAKE_STATUS_TONES,
  CYCLE_COUNT_TYPE_LABELS,
} from "@/types/stock-take/type";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const columns: ColumnDef<StockTake>[] = [
  {
    accessorKey: "takeNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock Take
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/stock-takes/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.takeNumber}
      </Link>
    ),
  },
  {
    accessorKey: "cycleCountType",
    header: "Type",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.cycleCountType
          ? CYCLE_COUNT_TYPE_LABELS[row.original.cycleCountType]
          : "—"}
        {row.original.blindCount && (
          <span className="ml-1 text-[10px] bg-amber-50 text-amber-700 rounded px-1 py-0.5">
            BLIND
          </span>
        )}
      </span>
    ),
  },
  {
    id: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const counted = row.original.itemsCounted ?? 0;
      const total = row.original.totalItems ?? 0;
      const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
      return (
        <div className="text-xs text-gray-600 space-y-1 min-w-[100px]">
          <div className="flex items-center justify-between">
            <span>{counted}</span>
            <span className="text-gray-400">/ {total}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-1 bg-blue-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "variance",
    header: () => <div className="text-right">Variance</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm">
        {row.original.itemsWithVariance > 0 ? (
          <span className="text-amber-700 font-medium">
            {row.original.itemsWithVariance}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "startedByName",
    header: "Started by",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.startedByName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_TAKE_STATUS_TONES[row.original.status]}`}
      >
        {STOCK_TAKE_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];
