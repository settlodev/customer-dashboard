"use client";

import { ColumnDef } from "@tanstack/react-table";

import {
  TILL_STATUS_LABELS,
  TILL_STATUS_TONES,
  type TillReconciliation,
} from "@/types/till/type";

const money = (n: number, c: string) =>
  `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${c}`;

export const columns: ColumnDef<TillReconciliation>[] = [
  {
    accessorKey: "businessDate",
    header: "Business date",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(row.original.businessDate),
        )}
      </span>
    ),
  },
  {
    accessorKey: "daySessionId",
    header: "Session",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.daySessionId.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: "expectedCash",
    header: () => <span className="block text-right">Expected</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {money(row.original.expectedCash, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: "countedCash",
    header: () => <span className="block text-right">Counted</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {money(row.original.countedCash, row.original.currency)}
      </div>
    ),
  },
  {
    accessorKey: "variance",
    header: () => <span className="block text-right">Variance</span>,
    cell: ({ row }) => {
      const v = row.original.variance;
      return (
        <div
          className={`text-right font-mono tabular-nums font-medium ${
            v === 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {v > 0 ? "+" : ""}
          {money(v, row.original.currency)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          TILL_STATUS_TONES[row.original.status]
        }`}
      >
        {TILL_STATUS_LABELS[row.original.status]}
      </span>
    ),
  },
];
