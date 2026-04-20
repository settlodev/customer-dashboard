"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PurchaseRequisition,
  REQUISITION_STATUS_LABELS,
  REQUISITION_STATUS_TONES,
  PRIORITY_LABELS,
  PRIORITY_TONES,
} from "@/types/requisition/type";
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

export const columns: ColumnDef<PurchaseRequisition>[] = [
  {
    accessorKey: "requisitionNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Requisition
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/purchase-requisitions/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.requisitionNumber}
      </Link>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_TONES[row.original.priority]}`}
      >
        {PRIORITY_LABELS[row.original.priority]}
      </span>
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
    id: "estimatedValue",
    header: () => <div className="text-right">Est. value</div>,
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, i) => sum + Number(i.requestedQuantity || 0) * Number(i.estimatedUnitCost || 0),
        0,
      );
      return (
        <div className="text-right text-sm font-medium text-gray-900">
          <Money amount={total} currency={row.original.currency || DEFAULT_CURRENCY} />
        </div>
      );
    },
  },
  {
    accessorKey: "requestedByName",
    header: "Requested by",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">{row.original.requestedByName || "—"}</span>
    ),
  },
  {
    accessorKey: "requiredByDate",
    header: "Needed by",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.requiredByDate)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${REQUISITION_STATUS_TONES[row.original.status]}`}
      >
        {REQUISITION_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
];
