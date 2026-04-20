"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Grn,
  GRN_STATUS_LABELS,
  GRN_STATUS_TONES,
} from "@/types/grn/type";
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

export const columns: ColumnDef<Grn>[] = [
  {
    accessorKey: "grnNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        GRN Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/goods-received/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.grnNumber}
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
    id: "totalQuantity",
    header: () => <div className="text-right">Qty</div>,
    cell: ({ row }) => {
      const total = row.original.items?.reduce(
        (sum, i) => sum + Number(i.receivedQuantity || 0),
        0,
      );
      return (
        <div className="text-right text-sm text-gray-600">{total?.toLocaleString() ?? 0}</div>
      );
    },
  },
  {
    id: "totalValue",
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => {
      const total =
        row.original.items?.reduce(
          (sum, i) => sum + Number(i.receivedQuantity || 0) * Number(i.unitCost || 0),
          0,
        ) ?? 0;
      const currency =
        row.original.currency || row.original.items?.[0]?.currency || DEFAULT_CURRENCY;
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
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${GRN_STATUS_TONES[row.original.status]}`}
      >
        {GRN_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    accessorKey: "receivedDate",
    header: "Received",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.receivedDate)}
      </span>
    ),
  },
];
