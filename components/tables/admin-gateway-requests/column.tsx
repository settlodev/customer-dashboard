"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { GatewayRequestRow } from "@/types/admin/gateway-requests";

/** Tone for the response status badge — null/unknown reads as muted. */
export function statusTone(code: number | null): BadgeTone {
  if (code == null) return "muted";
  if (code >= 500) return "neg";
  if (code >= 400) return "warn";
  if (code >= 300) return "open";
  if (code >= 200) return "ok";
  return "muted";
}

function originLine(row: GatewayRequestRow): string | null {
  const parts = [row.city, row.countryIsoCode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export const gatewayRequestColumns: ColumnDef<GatewayRequestRow>[] = [
  {
    accessorKey: "createdAt",
    enableHiding: false,
    header: "Time",
    cell: ({ row }) => {
      const ts = row.original.createdAt;
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
    accessorKey: "upstreamStatusCode",
    header: "Status",
    cell: ({ row }) => {
      const { httpMethod, upstreamStatusCode, upstreamResponseTimeMs } =
        row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Badge tone={statusTone(upstreamStatusCode)} className="w-fit">
              {upstreamStatusCode ?? "—"}
            </Badge>
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {httpMethod}
            </span>
          </div>
          {upstreamResponseTimeMs != null && (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {upstreamResponseTimeMs}ms
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "incomingIpAddress",
    header: "Origin",
    cell: ({ row }) => {
      const line = originLine(row.original);
      return (
        <div className="flex flex-col">
          <span className="whitespace-nowrap font-mono text-[12px] text-ink-2">
            {row.original.incomingIpAddress}
          </span>
          {line && (
            <span className="truncate text-[11px] text-muted-foreground">
              {line}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "incomingUrl",
    header: "Request",
    cell: ({ row }) => {
      const { incomingUrl, upstreamServerName } = row.original;
      return (
        <div className="flex min-w-0 max-w-[420px] flex-col" title={incomingUrl}>
          <span className="truncate font-mono text-[12.5px] text-ink">
            {incomingUrl}
          </span>
          {upstreamServerName && (
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              → {upstreamServerName}
            </span>
          )}
        </div>
      );
    },
  },
];
