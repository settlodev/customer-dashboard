"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ExternalLink, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { RefundRowActions } from "@/components/tables/admin-refunds/cell-action";
import { RefundResponse, RefundStatus } from "@/types/admin/billing";

const STATUS_BADGE: Record<RefundStatus, { label: string; className: string }> =
  {
    PENDING: {
      label: "Pending",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    },
    PROCESSED: {
      label: "Processed",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    },
    APPROVED: {
      label: "Approved",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    },
    REJECTED: {
      label: "Rejected",
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    },
  };

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function buildRefundColumns(): ColumnDef<RefundResponse>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      enableHiding: false,
      header: "Invoice",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
              <RotateCcw className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">
                {r.invoiceNumber}
              </p>
              {r.businessId ? (
                <Link
                  href={`/businesses/${r.businessId}/billing`}
                  data-no-row-click
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  {r.businessId}
                </Link>
              ) : (
                <span className="font-mono text-[11px] text-muted-foreground">
                  Prospect invoice
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: () => <span className="block text-right">Amount</span>,
      cell: ({ row }) => (
        <div className="text-right font-medium tabular-nums">
          {formatMoney(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <p
          className="max-w-[280px] truncate text-[13px]"
          title={row.original.reason}
        >
          {row.original.reason || "—"}
        </p>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Requested",
      cell: ({ row }) => (
        <span className="font-mono text-[11.5px] text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const badge = STATUS_BADGE[row.original.status] ?? {
          label: row.original.status,
          className: "border-muted bg-muted text-muted-foreground",
        };
        return (
          <Badge variant="outline" className={badge.className}>
            {badge.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div data-no-row-click>
          <RefundRowActions refund={row.original} />
        </div>
      ),
    },
  ];
}
