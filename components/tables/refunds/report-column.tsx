"use client";
import { ColumnDef } from "@tanstack/react-table";
import { RefundReportRow } from "@/types/refunds/type";

const money = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const shortDate = (iso: string | null | undefined) =>
  iso
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(iso))
    : "—";

export const columns: ColumnDef<RefundReportRow>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    enableHiding: false,
    cell: ({ row }) => row.original.orderNumber ?? "—",
  },
  {
    accessorKey: "orderItemName",
    header: "Item",
    enableHiding: false,
    cell: ({ row }) => row.original.orderItemName ?? "—",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => money(row.original.quantity),
  },
  {
    accessorKey: "refundNetAmount",
    header: "Refund amount",
    cell: ({ row }) => (
      <span className="tabular-nums">{money(row.original.refundNetAmount)}</span>
    ),
  },
  {
    accessorKey: "returnedCost",
    header: "Returned cost",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {money(row.original.returnedCost)}
      </span>
    ),
  },
  {
    accessorKey: "refundType",
    header: "Type",
    cell: ({ row }) => row.original.refundType || "—",
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => row.original.reason ?? "—",
  },
  {
    accessorKey: "refundedByName",
    header: "Refunded by",
    cell: ({ row }) => row.original.refundedByName ?? "—",
  },
  {
    accessorKey: "approvedByName",
    header: "Approved by",
    cell: ({ row }) => row.original.approvedByName ?? "—",
  },
  {
    accessorKey: "stockReturned",
    header: "Stock returned",
    cell: ({ row }) =>
      row.original.stockReturned ? (
        <span className="rounded-sm bg-green-500 px-1.5 py-0.5 text-xs text-white">
          Yes
        </span>
      ) : (
        <span className="rounded-sm bg-yellow-500 px-1.5 py-0.5 text-xs text-white">
          No
        </span>
      ),
  },
  {
    accessorKey: "refundDate",
    header: "Date of refund",
    cell: ({ row }) => shortDate(row.original.refundDate),
  },
];
