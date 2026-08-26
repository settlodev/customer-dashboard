"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronsUpDown, MapPin } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { AdminBusinessListItem } from "@/types/admin/business";
import { BusinessLifecycleSnapshot } from "@/types/admin/business-intel";
import { BusinessRowActions } from "@/components/tables/admin-businesses/cell-action";
import { Monogram } from "@/components/admin/shared/monogram";
import { formatDate, timeSince } from "@/components/admin/shared/format";
import {
  ACTIVITY_TONE,
  activityBadge,
  daysSinceLastOrder,
  formatLastOrder,
} from "@/lib/admin/lifecycle";

function SortHeader({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:text-ink"
    >
      {label}
      <ChevronsUpDown className="h-3 w-3 text-muted-2" />
    </button>
  );
}

// ── Activity (lifecycle) badge ───────────────────────────────────────
// Scoring lives in lib/admin/lifecycle so the locations list scores identically
// — the two rollups encode "never ordered" differently and callers shouldn't
// have to know which is which.

interface ColumnDeps {
  lifecycleByBusinessId: Record<string, BusinessLifecycleSnapshot>;
}

export function buildBusinessColumns({
  lifecycleByBusinessId,
}: ColumnDeps): ColumnDef<AdminBusinessListItem>[] {
  return [
    {
      accessorKey: "name",
      enableHiding: false,
      header: ({ column }) => (
        <SortHeader
          label="Business"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Monogram name={b.name} seed={b.id} size="lg" />
            <div className="min-w-0">
              <Link
                href={`/businesses/${b.id}`}
                className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink hover:text-[#C25E26]"
              >
                {b.name}
              </Link>
              <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
                {b.identifier}
                {b.email && <span className="text-muted-2"> · {b.email}</span>}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "owner",
      header: "Owner",
      enableHiding: true,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <Link
            href={`/accounts/${b.accountId}`}
            className="block min-w-0 hover:text-[#C25E26]"
          >
            <span className="block truncate text-[13px] text-ink">
              {b.accountFullName ?? "—"}
            </span>
            <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
              {b.accountEmail ?? b.accountNumber ?? ""}
            </span>
          </Link>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      enableHiding: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
            <span
              className={cn(
                "h-[7px] w-[7px] rounded-full",
                active ? "bg-pos" : "bg-muted-2",
              )}
            />
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      id: "activity",
      header: "Activity",
      enableHiding: true,
      cell: ({ row }) => {
        const { label, tone, hint } = activityBadge(
          lifecycleByBusinessId[row.original.id],
          "Business",
        );
        return (
          <span
            title={hint}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
              ACTIVITY_TONE[tone],
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {label}
          </span>
        );
      },
    },
    {
      id: "lastOrder",
      header: "Last order",
      enableHiding: true,
      cell: ({ row }) => {
        const lifecycle = lifecycleByBusinessId[row.original.id];
        return (
          <span className="font-mono text-[12px] text-muted-foreground">
            {lifecycle
              ? formatLastOrder(daysSinceLastOrder(lifecycle))
              : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "activeLocationCount",
      header: "Locations",
      enableHiding: true,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <span className="font-mono text-[12.5px] tabular-nums text-ink">
            {b.activeLocationCount}
            {b.locationCount !== b.activeLocationCount && (
              <span className="text-muted-foreground"> / {b.locationCount}</span>
            )}
          </span>
        );
      },
    },
    {
      id: "region",
      header: "Region",
      enableHiding: true,
      cell: ({ row }) => {
        const b = row.original;
        if (!b.region) return <span className="text-[12.5px] text-muted-2">—</span>;
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3">
            <MapPin className="h-3.5 w-3.5 text-muted-2" />
            {b.region}
            {b.district ? `, ${b.district}` : ""}
          </span>
        );
      },
    },
    {
      accessorKey: "baseCurrency",
      header: "Currency",
      enableHiding: true,
      cell: ({ row }) => (
        <span className="inline-flex rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.04em] text-ink-3">
          {row.original.baseCurrency}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      enableHiding: true,
      header: ({ column }) => (
        <SortHeader
          label="Created"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
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
      id: "actions",
      enableHiding: false,
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end" data-no-row-click>
          <BusinessRowActions business={row.original} />
        </div>
      ),
    },
  ];
}
