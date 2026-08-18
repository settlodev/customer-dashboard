"use client";

import { ColumnDef } from "@tanstack/react-table";

import { type FundTransfer } from "@/types/fund-transfer/type";

function moneyCell(
  value: number | null | undefined,
  currency: string,
  muteZero = false,
) {
  const n = value ?? 0;
  if (muteZero && n === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <>
      {n.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currency}
    </>
  );
}

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
  {
    accessorKey: "feeAmount",
    header: () => <span className="block text-right">Fee</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {moneyCell(row.original.feeAmount, row.original.currencyCode, true)}
      </div>
    ),
  },
  {
    accessorKey: "taxAmount",
    header: () => <span className="block text-right">Tax</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {moneyCell(row.original.taxAmount, row.original.currencyCode, true)}
      </div>
    ),
  },
  {
    accessorKey: "netAmount",
    header: () => <span className="block text-right">Net</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {moneyCell(
          row.original.netAmount ?? row.original.amount,
          row.original.currencyCode,
        )}
      </div>
    ),
  },
];
