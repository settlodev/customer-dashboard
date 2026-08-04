"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FINANCING_STATUS_LABELS,
  Lpo,
  effectiveLpoStatus,
} from "@/types/lpo/type";
import { FINANCING_BADGE_VARIANT } from "@/components/widgets/lpo/financing-card";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export interface LpoRow extends Lpo {
  supplierName: string | null;
}

export const columns: ColumnDef<LpoRow>[] = [
  {
    accessorKey: "lpoNumber",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        className="text-left p-0 font-semibold"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        LPO Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/purchase-orders/${row.original.id}`}
        className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline"
      >
        {row.original.lpoNumber}
      </Link>
    ),
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => (
      <span className="text-gray-600">{row.original.supplierName || "—"}</span>
    ),
  },
  {
    id: "progress",
    header: "Received",
    cell: ({ row }) => {
      const ordered = row.original.items.reduce(
        (sum, i) => sum + Number(i.orderedQuantity || 0),
        0,
      );
      const received = row.original.items.reduce(
        (sum, i) => sum + Number(i.receivedQuantity || 0),
        0,
      );
      const pct = ordered > 0 ? Math.round((received / ordered) * 100) : 0;
      return (
        <div className="text-xs text-gray-600 space-y-1 min-w-[100px]">
          <div className="flex items-center justify-between">
            <span>{received.toLocaleString()}</span>
            <span className="text-gray-400">/ {ordered.toLocaleString()}</span>
          </div>
          <div className="h-1 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-1 bg-green-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "totalValue",
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => {
      const total = row.original.items.reduce(
        (sum, i) => sum + Number(i.orderedQuantity || 0) * Number(i.unitCost || 0),
        0,
      );
      const currency =
        row.original.currency || row.original.items[0]?.currency || DEFAULT_CURRENCY;
      return (
        <div className="text-right font-medium text-gray-900">
          <Money amount={total} currency={currency} />
        </div>
      );
    },
  },
  {
    accessorKey: "createdByName",
    header: "Created by",
    cell: ({ row }) => (
      <span className="text-gray-600">
        {row.original.createdByName || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { label, tone } = effectiveLpoStatus(
        row.original.status,
        row.original.supplierAcknowledgement,
      );
      const financingStatus = row.original.financingStatus;
      // Cancellation never resets financingStatus (the backend resolves it
      // purely from the shadow order, independent of the LPO's own status),
      // so a cancelled row can still carry a stale REQUESTED/OFFER_MADE from
      // before it was called off — suppress those in-progress labels here.
      // PAID stays: if Settlo already disbursed, that's still true and worth
      // surfacing even on a cancelled order (mirrors the detail-page card).
      const suppressFinancingBadge =
        row.original.status === "CANCELLED" &&
        (financingStatus === "REQUESTED" || financingStatus === "OFFER_MADE");
      return (
        <div className="flex flex-col items-start gap-1">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
          >
            {label}
          </span>
          {financingStatus &&
            financingStatus !== "NONE" &&
            !suppressFinancingBadge && (
              <Badge variant={FINANCING_BADGE_VARIANT[financingStatus]}>
                {FINANCING_STATUS_LABELS[financingStatus]}
              </Badge>
            )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-gray-600 whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];
