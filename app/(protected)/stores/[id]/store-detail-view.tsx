"use client";

import { useState } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  CreditCard,
  Globe,
  Hash,
  MapPin,
  Settings2,
  Store as StoreIcon,
  Tag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StoreSubscriptionSetup from "@/components/subscription/StoreSubscriptionSetup";
import { EntityLockedNotice } from "@/components/subscription/EntityLockedNotice";
import { useEntitlements } from "@/context/entitlementContext";
import { Store } from "@/types/store/type";

const TABS = [
  { key: "overview", label: "Overview", icon: StoreIcon },
  { key: "address", label: "Location", icon: MapPin },
  { key: "subscription", label: "Subscription", icon: CreditCard },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StoreDetailView({ store }: { store: Store }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const { getEntityItem, loading, entitlements } = useEntitlements();

  // Pay-first gate: a store is locked until its OWN subscription is active AND past its free trial
  // (a new paid store's trial is gated too). Bundled/free stores are active + not-in-trial -> open.
  // Permissive when entitlement data is absent (provisioning lag / billing not configured).
  const item = getEntityItem(store.id);
  const storeLocked =
    !loading && entitlements != null && item != null && (!item.active || item.inTrial);
  const lockReason: "expired" | "unpaid" = item && !item.active ? "expired" : "unpaid";

  const createdAt = store.createdAt
    ? new Date(store.createdAt).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<Hash className="h-3 w-3" />}
            label="Identifier"
            value={
              store.identifier ? (
                <span className="font-mono text-[14px] tracking-[0.02em]">
                  {store.identifier}
                </span>
              ) : (
                "—"
              )
            }
          />
          <SummaryTile
            icon={<Tag className="h-3 w-3" />}
            label="Code"
            value={store.code ?? "—"}
          />
          <SummaryTile
            icon={<Settings2 className="h-3 w-3" />}
            label="Type"
            value={store.storeType ?? "—"}
          />
          <SummaryTile
            icon={<Globe className="h-3 w-3" />}
            label="Region"
            value={store.region ?? "—"}
          />
          <SummaryTile
            icon={<Activity className="h-3 w-3" />}
            label="Created"
            value={createdAt}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" &&
        (storeLocked ? (
          <EntityLockedNotice
            entityType="STORE"
            reason={lockReason}
            onSetup={() => setTab("subscription")}
          />
        ) : (
          <OverviewTab store={store} />
        ))}
      {tab === "address" &&
        (storeLocked ? (
          <EntityLockedNotice
            entityType="STORE"
            reason={lockReason}
            onSetup={() => setTab("subscription")}
          />
        ) : (
          <AddressTab store={store} />
        ))}
      {tab === "subscription" && (
        <StoreSubscriptionSetup
          storeId={store.id}
          storeName={store.name}
          businessId={store.businessId}
          locationId={store.locationId}
        />
      )}
    </div>
  );
}

function OverviewTab({ store }: { store: Store }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-violet-950/30">
              <StoreIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {store.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {store.identifier || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas px-3 py-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              State
            </span>
            <Badge
              variant={store.active ? "pos" : "soft"}
              className="text-[10.5px]"
            >
              {store.active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {store.slug && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[12px] text-ink">
                {store.slug}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Profile
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow icon={Tag} label="Code" value={store.code} />
              <DetailRow
                icon={Settings2}
                label="Type"
                value={store.storeType}
              />
              <DetailRow
                icon={Hash}
                label="Store number"
                value={store.storeNumber}
              />
              <DetailRow
                icon={Globe}
                label="Timezone"
                value={store.timezone}
              />
              <DetailRow
                icon={Building2}
                label="Capacity"
                value={store.capacity?.toString()}
              />
              <DetailRow
                icon={Hash}
                label="Identifier"
                value={
                  store.identifier ? (
                    <span className="font-mono text-[11.5px]">
                      {store.identifier}
                    </span>
                  ) : null
                }
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressTab({ store }: { store: Store }) {
  const hasCoords = store.latitude != null && store.longitude != null;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Address
          </h3>
          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow label="Address" value={store.address} />
              <DetailRow label="Postal code" value={store.postalCode} />
              <DetailRow label="Region" value={store.region} />
              <DetailRow label="District" value={store.district} />
              <DetailRow label="Ward" value={store.ward} />
              <DetailRow label="Timezone" value={store.timezone} />
            </dl>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Coordinates
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
            <DetailRow
              label="Latitude"
              value={
                store.latitude != null ? store.latitude.toString() : null
              }
            />
            <DetailRow
              label="Longitude"
              value={
                store.longitude != null ? store.longitude.toString() : null
              }
            />
          </div>
          {!hasCoords && (
            <p className="text-[12px] text-muted-foreground">
              Set coordinates to enable map-based pickup and delivery flows.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 text-[18px] font-semibold leading-none tracking-[-0.025em] text-ink">
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}
