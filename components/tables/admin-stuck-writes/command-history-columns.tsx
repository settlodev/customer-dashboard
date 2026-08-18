"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DollarSign } from "lucide-react";

import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import type { RepairCommandRow } from "@/types/admin/stuck-writes";

function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Read-only lifecycle view of repair commands. No actions. */
export function buildCommandHistoryColumns(): ColumnDef<RepairCommandRow>[] {
  return [
    {
      accessorKey: "requestedAt",
      header: "Requested",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-[13px] text-ink">
            {formatDateTime(row.original.requestedAt)}
          </span>
          <span className="font-mono text-[11.5px] text-muted-foreground">
            {timeSince(row.original.requestedAt)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "verb",
      header: "Verb",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-ink-2">
          {row.original.isMoneyOp && (
            <DollarSign className="h-3 w-3 flex-shrink-0 text-amber-500" />
          )}
          {row.original.verb}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-ink-2">
          {row.original.status}
        </span>
      ),
    },
    {
      id: "targetKey",
      header: "Target key",
      cell: ({ row }) => (
        <span
          className="font-mono text-[11.5px] text-ink-2"
          title={row.original.idempotencyKey ?? undefined}
        >
          {shortId(row.original.idempotencyKey)}
        </span>
      ),
    },
    {
      accessorKey: "deviceId",
      header: "Device",
      cell: ({ row }) => (
        <span
          className="font-mono text-[11.5px] text-ink-2"
          title={row.original.deviceId}
        >
          {shortId(row.original.deviceId)}
        </span>
      ),
    },
    {
      accessorKey: "requesterId",
      header: "Requested by",
      cell: ({ row }) => (
        <span
          className="font-mono text-[11.5px] text-ink-2"
          title={row.original.requesterId}
        >
          {shortId(row.original.requesterId)}
        </span>
      ),
    },
    {
      id: "acked",
      header: "Acked",
      cell: ({ row }) =>
        row.original.ackedAt ? (
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-[13px] text-ink">
              {formatDateTime(row.original.ackedAt)}
            </span>
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {timeSince(row.original.ackedAt)}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "result",
      header: "Result",
      cell: ({ row }) => (
        <span className="font-mono text-[11.5px] text-ink-2">
          {row.original.result ?? "—"}
        </span>
      ),
    },
  ];
}
