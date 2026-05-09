"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, ShieldCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  JOURNAL_ENTRY_STATUS_LABELS,
  JOURNAL_ENTRY_STATUS_TONES,
  type JournalEntry,
} from "@/types/journal-entry/type";

export const columns: ColumnDef<JournalEntry>[] = [
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
    accessorKey: "entryNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Entry #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/accounting/journal-entries/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.entryNumber}
      </Link>
    ),
  },
  {
    accessorKey: "entryDate",
    header: ({ column }) => (
      <Button
        className="text-left p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(row.original.entryDate),
        )}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[320px] truncate text-sm">
        {row.original.description ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "entryType",
    header: "Type",
    cell: ({ row }) => (
      <span className="font-mono text-[11px] uppercase text-muted-foreground">
        {row.original.entryType}
      </span>
    ),
  },
  {
    accessorKey: "totalDebit",
    header: () => <span className="block text-right">Debit / Credit</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums text-sm">
        <div>
          {row.original.totalDebit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.original.totalCredit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "balanced",
    header: "Balance",
    cell: ({ row }) =>
      row.original.balanced ? (
        <ShieldCheck className="h-4 w-4 text-green-600" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-red-500" />
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          JOURNAL_ENTRY_STATUS_TONES[row.original.status]
        }`}
      >
        {JOURNAL_ENTRY_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
];
