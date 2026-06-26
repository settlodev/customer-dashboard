"use client";

import { ColumnDef } from "@tanstack/react-table";

import { type FundTransfer } from "@/types/fund-transfer/type";

export const columns: ColumnDef<FundTransfer>[] = [
  {
    accessorKey: "transferDate",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
          new Date(row.original.transferDate),
        )}
      </span>
    ),
  },
  {
    accessorKey: "fromAccountName",
    header: "From",
    cell: ({ row }) =>
      row.original.fromAccountName ?? row.original.fromAccountCode ?? "—",
  },
  {
    accessorKey: "toAccountName",
    header: "To",
    cell: ({ row }) =>
      row.original.toAccountName ?? row.original.toAccountCode ?? "—",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.description ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <span className="block text-right">Amount</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {row.original.amount.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}{" "}
        {row.original.currencyCode}
      </div>
    ),
  },
];
