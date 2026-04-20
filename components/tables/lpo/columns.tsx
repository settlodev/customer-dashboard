"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Lpo,
  LPO_STATUS_LABELS,
  LPO_STATUS_TONES,
} from "@/types/lpo/type";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

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

export interface LpoRow extends Lpo {
  supplierName: string | null;
}

export const columns: ColumnDef<LpoRow>[] = [
  {
    accessorKey: "lpoNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        LPO Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/stock-purchases/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.lpoNumber}
      </Link>
    ),
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">{row.original.supplierName || "—"}</span>
    ),
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">{row.original.items?.length ?? 0}</span>
    ),
  },
  {
    id: "progress",
    header: "Received",
    cell: ({ row }) => {
      const ordered = row.original.items.reduce(
        (sum, i) => sum + Number(i.orderedQuantity || 0),
        0,
      );
      const received = row.original.items.reduce(
        (sum, i) => sum + Number(i.receivedQuantity || 0),
        0,
      );
      const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
      return (
        <div className="text-xs text-gray-600 space-y-1 min-w-[100px]">
          <div className="flex items-center justify-between">
            <span>{received.toLocaleString()}</span>
            <span className="text-gray-400">/ {ordered.toLocaleString()}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-1 bg-green-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "totalValue",
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, i) => sum + Number(i.orderedQuantity || 0) * Number(i.unitCost || 0),
        0,
      );
      const currency =
        row.original.currency || row.original.items[0]?.currency || DEFAULT_CURRENCY;
      return (
        <div className="text-right text-sm font-medium text-gray-900">
          <Money amount={total} currency={currency} />
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LPO_STATUS_TONES[row.original.status]}`}
      >
        {LPO_STATUS_LABELS[row.original.status]}
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
