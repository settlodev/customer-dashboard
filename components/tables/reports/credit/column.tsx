"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { UUID } from "node:crypto";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

interface CreditOrderRow {
  id: UUID;
  orderId: string;
  orderNumber: string;
  orderName?: string | null;
  openedDate: Date;
  customerName?: string | null;
  paidAmount: number;
  unpaidAmount: number;
}

export const creditColumns: ColumnDef<CreditOrderRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-medium tabular-nums">
        {row.original.orderNumber}
      </span>
    ),
  },
  {
    accessorKey: "orderName",
    header: "Order name",
    cell: ({ row }) =>
      row.original.orderName || (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "openedDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {format(new Date(row.original.openedDate), "dd MMM yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) =>
      row.original.customerName || (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "paidAmount",
    header: () => <div className="text-right">Paid</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
        TZS {fmt(row.original.paidAmount)}
      </div>
    ),
  },
  {
    accessorKey: "unpaidAmount",
    header: () => <div className="text-right">Unpaid</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums text-red-600 dark:text-red-400">
        TZS {fmt(row.original.unpaidAmount)}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: () => (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Unpaid
      </span>
    ),
  },
];
