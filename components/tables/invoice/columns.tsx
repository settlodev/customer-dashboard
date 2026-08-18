"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_TONES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
  invoiceBalanceDue,
  isInvoiceOverdue,
  type Invoice,
} from "@/types/invoicing/type";
import { initialsFor, thumbColor } from "@/components/tables/shared/table-avatar";

import { InvoiceCellAction } from "./cell-action";

const shortDate = (d?: string | null) =>
  d
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(d))
    : "—";

export const columns: ColumnDef<Invoice>[] = [
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
    accessorKey: "invoiceNumber",
    enableHiding: false,
    header: "Number",
    cell: ({ row }) => (
      <Link
        href={`/invoices/${row.original.id}`}
        className="font-mono text-[12.5px] font-semibold text-ink hover:underline"
      >
        {row.original.invoiceNumber}
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
    accessorKey: "issueDate",
    header: ({ column }) => (
      <Button
        className="p-0"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Issued
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const overdue = isInvoiceOverdue(row.original);
      return (
        <div className="font-mono text-xs">
          <div>{shortDate(row.original.issueDate)}</div>
          {row.original.dueDate && (
            <div className={overdue ? "text-red-600" : "text-muted-foreground"}>
              due {shortDate(row.original.dueDate)}
            </div>
          )}
        </div>
      );
    },
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
    cell: ({ row }) => {
      const due = invoiceBalanceDue(row.original);
      return (
        <div className="text-right">
          <div className="font-mono text-sm font-medium tabular-nums">
            {formatMoney(row.original.totalAmount, row.original.currencyCode)}
          </div>
          {due > 0 && row.original.paidAmount > 0 && (
            <div className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatMoney(due, row.original.currencyCode)} due
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const overdue = isInvoiceOverdue(row.original);
      return (
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              INVOICE_PAYMENT_STATUS_TONES[row.original.paymentStatus]
            }`}
          >
            {INVOICE_PAYMENT_STATUS_LABELS[row.original.paymentStatus]}
          </span>
          {overdue && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              Overdue
            </span>
          )}
          {row.original.status === "VOIDED" && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_TONES.VOIDED}`}
            >
              {INVOICE_STATUS_LABELS.VOIDED}
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <InvoiceCellAction data={row.original} />,
  },
];
