"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Monogram } from "@/components/admin/shared/monogram";
import { formatDate } from "@/components/admin/shared/format";
import { LocationRowActions } from "@/components/admin/locations/location-row-actions";
import type { SubscriptionStatus } from "@/types/admin/billing";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

// ── Subscription status badge ────────────────────────────────────────
type StatusTone = "pos" | "blue" | "warn" | "neg" | "muted";

const STATUS_TONE: Record<StatusTone, string> = {
  pos: "bg-pos-tint text-pos",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
};

const STATUS_META: Record<
  SubscriptionStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Active", tone: "pos" },
  TRIAL: { label: "Trial", tone: "blue" },
  PAST_DUE: { label: "Past due", tone: "warn" },
  EXPIRED: { label: "Expired", tone: "neg" },
  SUSPENDED: { label: "Suspended", tone: "neg" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

function SubscriptionStatusBadge({
  status,
}: {
  status: SubscriptionStatus | null;
}) {
  const meta = status
    ? STATUS_META[status] ?? { label: status, tone: "muted" as StatusTone }
    : { label: "No subscription", tone: "muted" as StatusTone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
        STATUS_TONE[meta.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
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
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.status} />,
    },
    {
      id: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const p = row.original.packageName;
        if (!p) return <span className="text-[12.5px] text-muted-2">—</span>;
        return (
          <span className="inline-flex rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-medium tracking-[0.02em] text-ink-3">
            {p}
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
