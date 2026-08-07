"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { GatewayRequestRow } from "@/types/admin/gateway-requests";

const METHOD_TONE: Record<
  string,
  "open" | "primary" | "warn" | "neg" | "muted"
> = {
  GET: "open",
  POST: "primary",
  PUT: "warn",
  PATCH: "warn",
  DELETE: "neg",
};

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
    accessorKey: "httpMethod",
    header: "Status",
    cell: ({ row }) => {
      const method = row.original.httpMethod;
      return (
        <Badge tone={METHOD_TONE[method] ?? "muted"} className="w-fit">
          {method}
        </Badge>
      );
    },
  },
  {
    accessorKey: "incomingIpAddress",
    header: "Origin",
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-[12px] text-ink-2">
        {row.original.incomingIpAddress}
      </span>
    ),
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
