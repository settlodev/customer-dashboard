"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  SupplierReturn,
  SUPPLIER_RETURN_STATUS_LABELS,
  SUPPLIER_RETURN_STATUS_TONES,
} from "@/types/supplier-return/type";
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

export interface SupplierReturnRow extends SupplierReturn {
  supplierName: string | null;
}

export const columns: ColumnDef<SupplierReturnRow>[] = [
  {
    accessorKey: "returnNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Return
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/supplier-returns/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.returnNumber}
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
    id: "totalQty",
    header: () => <div className="text-right">Qty</div>,
    cell: ({ row }) => {
      const total = row.original.items?.reduce(
        (sum, i) => sum + Number(i.quantity || 0),
        0,
      );
      return (
        <div className="text-right text-sm text-gray-600">
          {(total ?? 0).toLocaleString()}
        </div>
      );
    },
  },
  {
    id: "refundValue",
    header: () => <div className="text-right">Refund value</div>,
    cell: ({ row }) => {
      const total = row.original.items?.reduce(
        (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitCost || 0),
        0,
      );
      const currency =
        row.original.currency || row.original.items?.[0]?.currency || DEFAULT_CURRENCY;
      return (
        <div className="text-right text-sm font-medium text-gray-900">
          <Money amount={total ?? 0} currency={currency} />
        </div>
      );
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 truncate max-w-[180px] block">
        {row.original.reason || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SUPPLIER_RETURN_STATUS_TONES[row.original.status]}`}
      >
        {SUPPLIER_RETURN_STATUS_LABELS[row.original.status]}
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
