"use client";

import { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { ClientActivityRow } from "@/types/admin/activity-log";

interface ColumnDeps {
  /** locationId → human name, from the platform-locations picker list. */
  locationNameById: Record<string, string>;
}

/** First 8 chars of an id, for compact display. */
function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? id.slice(0, 8) : id;
}

export function buildActivityColumns({
  locationNameById,
}: ColumnDeps): ColumnDef<ClientActivityRow>[] {
  return [
    {
      accessorKey: "clientTs",
      enableHiding: false,
      header: "Time",
      cell: ({ row }) => {
        const ts = row.original.clientTs;
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
      accessorKey: "eventType",
      header: "Event",
      cell: ({ row }) => {
        const payload = row.original.payload;
        return (
          <span
            title={payload ?? undefined}
            className="inline-flex rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.02em] text-ink-2"
          >
            {row.original.eventType}
          </span>
        );
      },
    },
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ row }) =>
        row.original.orderNumber ? (
          <span className="font-mono text-[12.5px] text-ink-2">
            {row.original.orderNumber}
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-2">—</span>
        ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        const { targetType, targetId } = row.original;
        if (!targetType && !targetId) {
          return <span className="text-[12.5px] text-muted-2">—</span>;
        }
        return (
          <div className="flex min-w-0 flex-col" title={targetId ?? undefined}>
            <span className="text-[12.5px] text-ink-2">
              {targetType ?? "—"}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortId(targetId)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "staffId",
      header: "Staff",
      cell: ({ row }) => (
        <span
          title={row.original.staffId ?? undefined}
          className="font-mono text-[12px] text-ink-2"
        >
          {shortId(row.original.staffId)}
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
      accessorKey: "deviceSeq",
      header: "Device seq",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {row.original.deviceSeq}
        </span>
      ),
    },
  ];
}
