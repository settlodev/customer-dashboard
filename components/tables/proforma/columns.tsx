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
import { initialsFor, thumbColor } from "@/components/tables/shared/table-avatar";

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
        className="font-mono text-[12.5px] font-semibold text-ink hover:underline"
      >
        {row.original.proformaNumber}
      </Link>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.original.customerName || "—";
      return (
        <div className="flex max-w-[260px] items-center gap-2.5">
          <span
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg font-mono text-[11px] font-semibold text-white"
            style={{ background: thumbColor(name) }}
          >
            {initialsFor(name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{name}</div>
            {row.original.customerPhone && (
              <div className="truncate text-xs text-muted-foreground">
                {row.original.customerPhone}
              </div>
            )}
          </div>
        </div>
      );
    },
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
