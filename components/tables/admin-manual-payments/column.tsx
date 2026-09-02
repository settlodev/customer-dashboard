"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Banknote, ExternalLink, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ManualPaymentRowActions } from "@/components/tables/admin-manual-payments/cell-action";
import { resolveActorName } from "@/lib/admin/actor-names";
import { ManualPaymentResponse, ManualPaymentStatus } from "@/types/admin/billing";

const STATUS_BADGE: Record<ManualPaymentStatus, { label: string; className: string }> =
  {
    PENDING: {
      label: "Pending",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    },
    APPROVED: {
      label: "Approved",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    },
    CANCELLED: {
      label: "Cancelled",
      className:
        "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    },
  };

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MOBILE_MONEY: "Mobile money",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  CHECK: "Cheque",
  OTHER: "Other",
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

export function buildManualPaymentColumns(
  actorNames: Record<string, string> = {},
): ColumnDef<ManualPaymentResponse>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      enableHiding: false,
      header: "Invoice",
      cell: ({ row }) => {
        const p = row.original;
        const isOverdue =
          p.status === "PENDING" &&
          !!p.invoiceDueDate &&
          new Date(p.invoiceDueDate) < new Date();
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <Banknote className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium text-gray-900 dark:text-gray-100">
                {p.invoiceNumber ?? "—"}
                {isOverdue && (
                  <span
                    title={`Past due since ${formatDateTime(p.invoiceDueDate)} — only a system admin can approve this.`}
                    className="inline-flex items-center gap-0.5 rounded-[3px] border border-rose-200 bg-rose-50 px-1 py-0 text-[10px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    <TriangleAlert className="h-2.5 w-2.5" />
                    Overdue
                  </span>
                )}
              </p>
              {p.businessId ? (
                <Link
                  href={`/businesses/${p.businessId}/billing`}
                  data-no-row-click
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  {p.businessId}
                </Link>
              ) : (
                <span className="font-mono text-[11px] text-muted-foreground">
                  Business unresolved
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
      accessorKey: "paymentMethod",
      header: "Method / reference",
      cell: ({ row }) => (
        <div className="text-[13px]">
          <p>{PAYMENT_METHOD_LABEL[row.original.paymentMethod] ?? row.original.paymentMethod}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {row.original.referenceNumber}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "recordedBy",
      header: "Requested by",
      cell: ({ row }) => (
        <span className="text-[13px]">
          {resolveActorName(row.original.recordedBy, actorNames)}
        </span>
      ),
    },
    {
      accessorKey: "recordedAt",
      header: "Recorded",
      cell: ({ row }) => (
        <span className="font-mono text-[11.5px] text-muted-foreground">
          {formatDateTime(row.original.recordedAt)}
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
          <ManualPaymentRowActions payment={row.original} />
        </div>
      ),
    },
  ];
}
