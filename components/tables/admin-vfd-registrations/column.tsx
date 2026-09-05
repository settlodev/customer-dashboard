"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { AdminVfdRegistrationListItem } from "@/types/admin/vfd-registration";
import { formatDate, timeSince } from "@/components/admin/shared/format";

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[12.5px] text-muted-2">—</span>;
  const variant = status === "Active" ? "pos" : status === "Pending" ? "warn" : "soft";
  return <Badge variant={variant}>{status}</Badge>;
}

export function buildVfdRegistrationColumns(): ColumnDef<AdminVfdRegistrationListItem>[] {
  return [
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {r.firstName} {r.lastName}
            </span>
            <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
              {r.accountEmail}
              {r.phoneNumber && <span className="text-muted-2"> · {r.phoneNumber}</span>}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => (
        <span className="block truncate text-[13px] text-ink">
          {row.original.businessName}
        </span>
      ),
    },
    {
      accessorKey: "locationName",
      header: "Location",
      cell: ({ row }) => (
        <span className="block truncate text-[13px] text-ink-3">
          {row.original.locationName}
        </span>
      ),
    },
    {
      accessorKey: "externalStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.externalStatus} />,
    },
    {
      accessorKey: "externalStatusMessage",
      header: "Status message",
      cell: ({ row }) => (
        <span className="block max-w-[240px] truncate text-[12.5px] text-muted-foreground">
          {row.original.externalStatusMessage ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "taxOffice",
      header: "Tax office",
      cell: ({ row }) => (
        <span className="text-[12.5px] text-ink-3">
          {row.original.taxOffice ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        const created = row.original.createdAt;
        return (
          <div className="flex flex-col">
            <span className="text-[13px] text-ink">{formatDate(created)}</span>
            <span className="font-mono text-[11.5px] text-muted-foreground">
              {timeSince(created)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last updated",
      cell: ({ row }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {timeSince(row.original.updatedAt)}
        </span>
      ),
    },
  ];
}
