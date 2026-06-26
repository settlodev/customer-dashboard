"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceResponse, InvoiceStatus } from "@/types/admin/billing";

const INVOICE_STATUS_BADGE: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "border-muted bg-muted text-muted-foreground",
  },
  PENDING: {
    label: "Pending",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  PAID: {
    label: "Paid",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  FAILED: {
    label: "Failed",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-muted bg-muted text-muted-foreground",
  },
  REFUNDED: {
    label: "Refunded",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  },
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function buildInvoiceColumns({
  onView,
}: {
  onView: (invoice: InvoiceResponse) => void;
}): ColumnDef<InvoiceResponse>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      enableHiding: false,
      header: "Invoice",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-ink">
            {row.original.invoiceNumber}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.lineItems.length} line
            {row.original.lineItems.length === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={INVOICE_STATUS_BADGE[row.original.status].className}
        >
          {INVOICE_STATUS_BADGE[row.original.status].label}
        </Badge>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: () => <span className="block text-right">Total</span>,
      cell: ({ row }) => (
        <div className="text-right font-medium tabular-nums">
          {formatMoney(row.original.totalAmount)}
        </div>
      ),
    },
    {
      accessorKey: "invoiceDate",
      header: "Issued",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.invoiceDate)}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: "paidAt",
      header: "Paid",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(row.original.paidAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end" data-no-row-click>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Actions for ${row.original.invoiceNumber}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onView(row.original)}>
                View / actions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
