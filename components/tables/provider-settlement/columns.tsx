"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { type ProviderSettlementBalance } from "@/types/provider-settlement/type";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(iso),
  );
};

export const columns: ColumnDef<ProviderSettlementBalance>[] = [
  {
    accessorKey: "paymentMethodCode",
    header: "Provider",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.paymentMethodCode}</span>
    ),
  },
  {
    accessorKey: "outstandingBalance",
    header: () => <span className="block text-right">Outstanding</span>,
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {row.original.outstandingBalance.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}{" "}
        {row.original.currency}
      </div>
    ),
  },
  {
    accessorKey: "oldestUnsettledAt",
    header: "Oldest unsettled",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.oldestUnsettledAt)}
      </span>
    ),
  },
  {
    accessorKey: "outstandingChargeCount",
    header: "Charges",
    cell: ({ row }) => <span>{row.original.outstandingChargeCount}</span>,
  },
  {
    accessorKey: "lastSettlementAt",
    header: "Last settlement",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {formatDate(row.original.lastSettlementAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="block text-right">Payout</span>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button asChild size="sm" variant="outline">
          <Link
            href={`/accounting/provider-settlements/new?paymentMethodId=${row.original.paymentMethodId}&code=${encodeURIComponent(row.original.paymentMethodCode)}`}
          >
            Record payout
          </Link>
        </Button>
      </div>
    ),
  },
];
