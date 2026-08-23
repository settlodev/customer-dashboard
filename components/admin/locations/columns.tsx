"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { Monogram } from "@/components/admin/shared/monogram";
import { formatDate } from "@/components/admin/shared/format";
import { LocationRowActions } from "@/components/admin/locations/location-row-actions";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

/**
 * Per-location subscription badge. `status` is the location's own
 * SubscriptionItemStatus — Billing has no TRIAL member, so a live trial is a
 * derived state (Reports sends it as `isTrial`) and gets its own badge rather
 * than being folded into the status enum.
 */
function LocationSubscriptionBadge({ row }: { row: PlatformLocationRow }) {
  if (row.isTrial) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-[12.5px] font-semibold text-[#2563EB]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        Trial
      </span>
    );
  }
  return <SubscriptionItemStatusBadge status={row.status} />;
}

export function buildLocationColumns(): ColumnDef<PlatformLocationRow>[] {
  return [
    {
      accessorKey: "locationName",
      enableHiding: false,
      header: "Location",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <Link
            href={`/locations/${l.locationId}`}
            className="flex min-w-0 items-center gap-3 hover:text-[#C25E26]"
          >
            <Monogram name={l.locationName || "—"} seed={l.locationId} size="lg" />
            <div className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold tracking-[-0.01em] text-ink">
                {l.locationName || "—"}
              </span>
              {l.region && (
                <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
                  <MapPin className="mr-1 inline h-3 w-3 text-muted-2" />
                  {l.region}
                </span>
              )}
            </div>
          </Link>
        );
      },
    },
    {
      id: "business",
      header: "Business",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <Link
            href={`/businesses/${l.businessId}`}
            className="block min-w-0 text-[13px] text-ink hover:text-[#C25E26]"
          >
            <span className="block truncate">{l.businessName ?? "—"}</span>
          </Link>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Subscription",
      cell: ({ row }) => <LocationSubscriptionBadge row={row.original} />,
    },
    {
      id: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const l = row.original;
        if (!l.packageName)
          return <span className="text-[12.5px] text-muted-2">—</span>;
        return (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="inline-flex rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.02em] text-ink-3">
              {l.packageName}
            </span>
            {l.isBundled && (
              <span
                title="Bundled — inherits the parent location's plan, not billed separately"
                className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-2"
              >
                bundled
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "mrr",
      header: "MRR",
      cell: ({ row }) => {
        const l = row.original;
        // Bundled units carry no charge of their own — the parent's item does.
        if (l.isBundled || !l.monthlyAmount)
          return <span className="text-[12.5px] text-muted-2">—</span>;
        return (
          <span className="font-mono text-[12.5px] tabular-nums text-ink">
            {l.monthlyAmount.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </span>
        );
      },
    },
    {
      id: "trialEnds",
      header: "Trial ends",
      cell: ({ row }) => {
        const t = row.original.trialEndDate;
        if (!t) return <span className="text-[12.5px] text-muted-2">—</span>;
        return (
          <span className="font-mono text-[12px] text-muted-foreground">
            {formatDate(t)}
          </span>
        );
      },
    },
    {
      id: "paidThrough",
      header: "Paid through",
      cell: ({ row }) => {
        const p = row.original.paidThrough;
        if (!p) return <span className="text-[12.5px] text-muted-2">Never</span>;
        return (
          <span className="font-mono text-[12px] text-muted-foreground">
            {formatDate(p)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <LocationRowActions locationId={row.original.locationId} />
        </div>
      ),
    },
  ];
}
