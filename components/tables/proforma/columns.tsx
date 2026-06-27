"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/helpers";
import {
  PROFORMA_STATUS_LABELS,
  PROFORMA_STATUS_TONES,
  type Proforma,
} from "@/types/invoicing/type";

import { ProformaCellAction } from "./cell-action";

const shortDate = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d))
    : "—";

export const columns: ColumnDef<Proforma>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "proformaNumber",
    enableHiding: false,
    header: "Number",
    cell: ({ row }) => (
      <Link
        href={`/proforma-invoices/${row.original.id}`}
        className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700 hover:underline"
      >
        {row.original.proformaNumber}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div className="max-w-[240px]">
        <div className="truncate text-sm font-medium">
          {row.original.customerName || "—"}
        </div>
        {row.original.customerPhone && (
          <div className="truncate text-xs text-muted-foreground">
            {row.original.customerPhone}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "validUntil",
    header: "Valid until",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {shortDate(row.original.validUntil)}
      </span>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <Button
        className="p-0 text-right"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono text-sm font-medium tabular-nums">
        {formatMoney(row.original.totalAmount, row.original.currencyCode)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          PROFORMA_STATUS_TONES[row.original.status]
        }`}
      >
        {PROFORMA_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ProformaCellAction data={row.original} />,
  },
];
