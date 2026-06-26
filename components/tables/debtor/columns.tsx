"use client";

import { ColumnDef } from "@tanstack/react-table";

import {
  AGING_BUCKET_LABELS,
  AGING_BUCKET_TONES,
  type CustomerArBalance,
} from "@/types/customer-ar/type";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export const columns: ColumnDef<CustomerArBalance>[] = [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.customerName ??
          row.original.customerId.slice(0, 8) + "…"}
      </span>
    ),
  },
  {
    accessorKey: "outstandingBalance",
    header: () => <span className="block text-right">Outstanding</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums font-medium">
        {fmt(row.original.outstandingBalance)} {row.original.currency}
      </div>
    ),
  },
  {
    accessorKey: "outstandingOrderCount",
    header: () => <span className="block text-right">Orders</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {row.original.outstandingOrderCount}
      </div>
    ),
  },
  {
    accessorKey: "oldestUnsettledAt",
    header: "Oldest unsettled",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.oldestUnsettledAt
          ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(row.original.oldestUnsettledAt),
            )
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "agingBucket",
    header: "Aging",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          AGING_BUCKET_TONES[row.original.agingBucket]
        }`}
      >
        {AGING_BUCKET_LABELS[row.original.agingBucket]}
      </span>
    ),
  },
];
