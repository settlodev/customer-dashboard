"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Rfq,
  RFQ_STATUS_LABELS,
  RFQ_STATUS_TONES,
} from "@/types/rfq/type";

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

export const columns: ColumnDef<Rfq>[] = [
  {
    accessorKey: "rfqNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        RFQ
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/rfqs/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.rfqNumber}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-gray-900 truncate max-w-[260px] block">
        {row.original.title}
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
    id: "quotes",
    header: "Quotes",
    cell: ({ row }) => {
      const submitted = row.original.quotes?.filter((q) => q.status !== "PENDING").length ?? 0;
      const total = row.original.quotes?.length ?? 0;
      return (
        <span className="text-sm text-gray-600">
          {submitted} / {total}
        </span>
      );
    },
  },
  {
    accessorKey: "submissionDeadline",
    header: "Deadline",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDate(row.original.submissionDeadline)}
      </span>
    ),
  },
  {
    accessorKey: "targetCurrency",
    header: "Currency",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
        {row.original.targetCurrency || row.original.currency || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${RFQ_STATUS_TONES[row.original.status]}`}
      >
        {RFQ_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Created by",
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">{row.original.createdByName || "—"}</span>
    ),
  },
];
