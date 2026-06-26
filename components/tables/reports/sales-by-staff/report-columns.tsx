"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { StaffSummaryReportRow } from "@/types/staff";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

export const reportColumns: ColumnDef<StaffSummaryReportRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "totalOrdersCompleted",
    header: () => <div className="text-right">Orders</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.totalOrdersCompleted}
      </div>
    ),
  },
  {
    accessorKey: "totalItemsSold",
    header: () => <div className="text-right">Items sold</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.totalItemsSold}
      </div>
    ),
  },
  {
    accessorKey: "totalStockIntakePerformed",
    header: () => <div className="text-right">Stock intakes</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.totalStockIntakePerformed ?? 0}
      </div>
    ),
  },
  {
    accessorKey: "totalGrossAmount",
    header: () => <div className="text-right">Gross amount</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        TZS {fmt(row.original.totalGrossAmount)}
      </div>
    ),
  },
  {
    accessorKey: "totalNetAmount",
    header: () => <div className="text-right">Net amount</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        TZS {fmt(row.original.totalNetAmount)}
      </div>
    ),
  },
  {
    accessorKey: "totalGrossProfit",
    header: () => <div className="text-right">Gross profit</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums text-green-600">
        TZS {fmt(row.original.totalGrossProfit)}
      </div>
    ),
  },
];
