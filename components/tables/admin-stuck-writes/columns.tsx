"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, DollarSign } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { DeadLetterDetailsDialog } from "@/components/admin/stuck-writes/dead-letter-details-dialog";
import { RepairActionDialog } from "@/components/admin/stuck-writes/repair-action-dialog";
import type { DeadLetterRow } from "@/types/admin/stuck-writes";

interface ColumnDeps {
  /** locationId → display name, from the platform-locations picker. */
  locationNameById: Record<string, string>;
  /** Whether the current operator holds REPAIR_EXECUTE. */
  canExecute: boolean;
  /** Current operator userId — passed as requesterId to the server action. */
  requesterId: string;
  /** Called after a successful repair action so the view can router.refresh(). */
  onActionDone: () => void;
}

function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

const CLASSIFICATION_STYLES: Record<string, string> = {
  terminal: "border-destructive/30 bg-destructive/5 text-destructive",
  conflict: "border-amber-300/40 bg-amber-50 text-amber-700",
  validation: "border-orange-300/40 bg-orange-50 text-orange-700",
  stale: "border-line bg-canvas text-ink-3",
};

export function buildDeadLetterColumns({
  locationNameById,
  canExecute,
  requesterId,
  onActionDone,
}: ColumnDeps): ColumnDef<DeadLetterRow>[] {
  return [
    {
      accessorKey: "deadLetteredAt",
      header: "Dead-lettered",
      enableHiding: false,
      cell: ({ row }) => {
        const ts = row.original.deadLetteredAt;
        return (
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-[13px] text-ink">
              {formatDateTime(ts)}
            </span>
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {timeSince(ts)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "opType",
      header: "Op",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.02em] text-ink-2">
          {row.original.isMoneyOp && (
            <span title="Money op — discard requires admin approval">
              <DollarSign className="h-3 w-3 flex-shrink-0 text-amber-500" />
            </span>
          )}
          {row.original.opType}
        </span>
      ),
    },
    {
      accessorKey: "classification",
      header: "Class",
      cell: ({ row }) => {
        const c = row.original.classification;
        return (
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium",
              CLASSIFICATION_STYLES[c] ?? "border-line bg-canvas text-ink-3",
            )}
          >
            {c}
          </span>
        );
      },
    },
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => {
        const { orderNumber, resourceId } = row.original;
        return orderNumber ? (
          <span className="font-mono text-[12.5px] text-ink-2">{orderNumber}</span>
        ) : (
          <span
            title={resourceId ?? undefined}
            className="font-mono text-[12px] text-muted-foreground"
          >
            {shortId(resourceId)}
          </span>
        );
      },
    },
    {
      accessorKey: "attempts",
      header: "Tries",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-ink-2">{row.original.attempts}</span>
      ),
    },
    {
      accessorKey: "deviceId",
      header: "Device",
      cell: ({ row }) => (
        <span title={row.original.deviceId} className="font-mono text-[12px] text-ink-2">
          {shortId(row.original.deviceId)}
        </span>
      ),
    },
    {
      accessorKey: "locationId",
      header: "Location",
      cell: ({ row }) => {
        const id = row.original.locationId;
        const name = id ? locationNameById[id] : undefined;
        return (
          <span
            title={id ?? undefined}
            className={cn(
              "text-[12.5px]",
              name ? "text-ink-2" : "font-mono text-muted-foreground",
            )}
          >
            {name ?? shortId(id)}
          </span>
        );
      },
    },
    {
      id: "lastError",
      header: "Last error",
      cell: ({ row }) => {
        const err = row.original.lastError;
        return err ? (
          <span
            title={err}
            className="flex max-w-[180px] items-center gap-1 truncate font-mono text-[11.5px] text-destructive"
          >
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            {err}
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <DeadLetterDetailsDialog row={row.original} />
          {canExecute && (
            <RepairActionDialog
              row={row.original}
              requesterId={requesterId}
              onActionDone={onActionDone}
            />
          )}
        </div>
      ),
    },
  ];
}
