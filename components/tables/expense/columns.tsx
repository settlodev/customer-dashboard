"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  type Expense,
} from "@/types/expense/type";

import { ExpenseCellAction } from "./cell-action";

const formatMoney = (amount: number, currency: string) =>
  `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

export const columns: ColumnDef<Expense>[] = [
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
    accessorKey: "expenseNumber",
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
        href={`/expenses/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.expenseNumber}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[280px]">
        <div className="truncate text-sm font-medium">
          {row.original.description ?? "—"}
        </div>
        {row.original.reference && (
          <div className="truncate text-xs text-muted-foreground">
            Ref: {row.original.reference}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "expenseDate",
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
    cell: ({ row }) => {
      const date = row.original.expenseDate;
      return date ? (
        <span className="font-mono text-xs">
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(date),
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <Button
        className="text-right p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        <div className="font-mono text-sm tabular-nums font-medium">
          {formatMoney(row.original.totalAmount, row.original.currencyCode)}
        </div>
        {row.original.balanceDue > 0 && row.original.paidAmount > 0 && (
          <div className="font-mono text-xs text-muted-foreground tabular-nums">
            paid {formatMoney(row.original.paidAmount, row.original.currencyCode)}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          EXPENSE_STATUS_TONES[row.original.status]
        }`}
      >
        {EXPENSE_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          PAYMENT_STATUS_TONES[row.original.paymentStatus]
        }`}
      >
        {PAYMENT_STATUS_LABELS[row.original.paymentStatus]}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ExpenseCellAction data={row.original} />,
  },
];
