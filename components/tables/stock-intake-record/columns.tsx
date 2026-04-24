"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  StockIntakeRecord,
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";

const STATUS_TONES: Record<StockIntakeRecordStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

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

export const columns: ColumnDef<StockIntakeRecord>[] = [
  {
    accessorKey: "referenceNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Reference
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/stock-intakes/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.referenceNumber}
      </Link>
    ),
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => (
      <div className="min-w-[160px]">
        <div className="text-sm text-gray-700">
          {row.original.supplierName || <span className="text-gray-400">—</span>}
        </div>
        {row.original.supplierReference && (
          <div className="text-[11px] text-gray-400 font-mono">
            {row.original.supplierReference}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "totalItems",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">{row.original.totalItems}</span>
    ),
  },
  {
    id: "totalQuantity",
    header: () => <div className="text-right">Total qty</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm text-gray-600">
        {Number(row.original.totalQuantity ?? 0).toLocaleString()}
      </div>
    ),
  },
  {
    id: "totalValue",
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm font-medium text-gray-900">
        <Money
          amount={Number(row.original.totalValue ?? 0)}
          currency={row.original.currency || DEFAULT_CURRENCY}
        />
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONES[row.original.status]}`}
      >
        {STOCK_INTAKE_RECORD_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    accessorKey: "receivedDate",
    header: "Received",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.receivedDate ?? row.original.createdAt)}
      </span>
    ),
  },
];
