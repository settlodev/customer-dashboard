"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  CalendarDays,
  CreditCard,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Star,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableAvatar } from "@/components/tables/shared/table-avatar";
import { usePermissions } from "@/context/permissionsContext";
import { CustomerPrepaidAccountTab } from "@/components/customer/customer-prepaid-account-tab";
import {
  Customer,
  CustomerPreference,
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_CREATED_FROM_LABELS,
  ADDRESS_TYPE_LABELS,
} from "@/types/customer/type";

interface Props {
  customer: Customer;
  preferences: CustomerPreference[];
}

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "loyalty", label: "Loyalty & Credit", icon: Star },
  { key: "prepayments", label: "Prepaid account", icon: Wallet },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "preferences", label: "Preferences", icon: Tag },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function CustomerDetailView({ customer, preferences }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");
  const { hasPermission } = usePermissions();

  const memberSince = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString()
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-line bg-line">
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 md:grid-cols-5">
          <SummaryTile
            icon={<Star className="h-3 w-3" />}
            label="Loyalty"
            value={customer.loyaltyPoints.toLocaleString()}
            unit="pts"
            delta={
              customer.loyaltyPointsCarryOver > 0
                ? `+${customer.loyaltyPointsCarryOver.toLocaleString()} carry`
                : undefined
            }
            tone={customer.loyaltyPoints > 0 ? "pos" : "neutral"}
          />
          <SummaryTile
            icon={<CreditCard className="h-3 w-3" />}
            label="Credit limit"
            value={
              customer.creditLimit != null
                ? customer.creditLimit.toLocaleString()
                : "—"
            }
            unit={customer.creditLimit != null ? "TZS" : undefined}
          />
          <SummaryTile
            icon={<AlertTriangle className="h-3 w-3" />}
            label="No-shows"
            value={customer.noShowCount.toString()}
            tone={customer.noShowCount > 2 ? "neg" : "neutral"}
          />
          <SummaryTile
            icon={
              customer.allowNotifications ? (
                <Bell className="h-3 w-3" />
              ) : (
                <BellOff className="h-3 w-3" />
              )
            }
            label="Notifications"
            value={customer.allowNotifications ? "On" : "Off"}
            tone={customer.allowNotifications ? "pos" : "neutral"}
          />
          <SummaryTile
            icon={<CalendarDays className="h-3 w-3" />}
            label="Member since"
            value={memberSince}
          />
        </div>
      </div>

      {/* ── Tabs (segmented underline — matches staff detail) ── */}
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.filter(
            (t) =>
              t.key !== "prepayments" ||
              hasPermission("customer_prepayments:view"),
          ).map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "addresses" && customer.addresses?.length > 0) {
              badge = String(customer.addresses.length);
            }
            if (t.key === "preferences" && preferences.length > 0) {
              badge = String(preferences.length);
            }
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
                {badge && (
                  <span
                    className={`rounded-[3px] px-1.5 font-mono text-[9.5px] tracking-[0.02em] ${
                      isActive
                        ? "border border-line bg-card text-ink-3"
                        : "bg-canvas text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === "overview" && <OverviewTab customer={customer} />}
      {tab === "loyalty" && <LoyaltyTab customer={customer} />}
      {tab === "prepayments" && (
        <CustomerPrepaidAccountTab
          customerId={customer.id}
          locationId={customer.locationId}
        />
      )}
      {tab === "addresses" && <AddressesTab customer={customer} />}
      {tab === "preferences" && <PreferencesTab preferences={preferences} />}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────

function OverviewTab({ customer }: { customer: Customer }) {
  const fullName = `${customer.firstName} ${customer.lastName}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Identity panel */}
      <Card className="lg:col-span-1">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <TableAvatar name={fullName} seed={customer.id} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {customer.customerAccountNumber || "—"}
              </p>
            </div>
          </div>

          {customer.customerGroupName && (
            <div className="flex items-center gap-2 rounded-md border border-line bg-canvas px-3 py-2">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span className="text-[12px] font-medium text-ink">
                {customer.customerGroupName}
              </span>
            </div>
          )}

          {customer.notes && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Staff notes
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink-2">
                {customer.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal + identification */}
      <Card className="lg:col-span-2">
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            Profile
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow icon={Phone} label="Phone" value={customer.phoneNumber} />
              <DetailRow icon={Mail} label="Email" value={customer.email} />
              <DetailRow label="Gender" value={customer.gender} />
              <DetailRow
                icon={CalendarIcon}
                label="Date of birth"
                value={
                  customer.dateOfBirth
                    ? new Date(customer.dateOfBirth).toLocaleDateString()
                    : null
                }
              />
              <DetailRow
                label="Source"
                value={
                  customer.source
                    ? CUSTOMER_SOURCE_LABELS[customer.source]
                    : null
                }
              />
              <DetailRow
                label="Created from"
                value={
                  customer.createdFrom
                    ? CUSTOMER_CREATED_FROM_LABELS[customer.createdFrom]
                    : null
                }
              />
              <DetailRow
                icon={customer.allowNotifications ? Bell : BellOff}
                label="Notifications"
                value={customer.allowNotifications ? "Enabled" : "Disabled"}
              />
              <DetailRow
                icon={IdCard}
                label="Identifier"
                value={
                  customer.identifier ? (
                    <span className="font-mono text-[11px] tracking-[0.02em]">
                      {customer.identifier}
                    </span>
                  ) : null
                }
              />
            </dl>
          </div>

          <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Identification
          </h3>
          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow label="ID type" value={customer.idType} />
              <DetailRow label="ID number" value={customer.idNumber} />
              <DetailRow label="TIN number" value={customer.tinNumber} />
              <DetailRow label="VRN" value={customer.vrn} />
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Loyalty & Credit ────────────────────────────────────────────────

function LoyaltyTab({ customer }: { customer: Customer }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-muted-foreground" />
              Loyalty points
            </h3>
            <Badge
              variant={customer.loyaltyPoints > 0 ? "pos" : "soft"}
              className="text-[10.5px]"
            >
              {customer.loyaltyPoints > 0 ? "Earning" : "No activity"}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {customer.loyaltyPoints.toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                pts
              </span>
            </div>
            {customer.loyaltyPointsCarryOver > 0 && (
              <p className="text-[12px] text-muted-foreground">
                Plus{" "}
                <span className="font-mono tabular-nums text-ink-2">
                  {customer.loyaltyPointsCarryOver.toLocaleString()}
                </span>{" "}
                carried over from prior cycles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Credit limit
            </h3>
            <Badge
              variant={customer.creditLimit != null ? "soft" : "outline"}
              className="text-[10.5px]"
            >
              {customer.creditLimit != null ? "Set" : "Not set"}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
                {customer.creditLimit != null
                  ? customer.creditLimit.toLocaleString()
                  : "—"}
              </span>
              {customer.creditLimit != null && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  TZS
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Maximum balance allowed across credit-sale orders.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="space-y-3 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Reservation reliability
          </h3>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            <DetailRow
              label="No-show count"
              value={
                <span
                  className={
                    customer.noShowCount > 2
                      ? "text-neg"
                      : customer.noShowCount > 0
                        ? "text-warn"
                        : undefined
                  }
                >
                  {customer.noShowCount}
                </span>
              }
            />
            <DetailRow
              label="Status"
              value={
                <Badge
                  variant={customer.active ? "pos" : "soft"}
                  className="text-[10.5px]"
                >
                  {customer.active ? "Active" : "Inactive"}
                </Badge>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Addresses ───────────────────────────────────────────────────────

function AddressesTab({ customer }: { customer: Customer }) {
  const addresses = customer.addresses ?? [];

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No addresses on file. Capture one when you next take an order or
            reservation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {addresses.map((addr) => (
        <Card key={addr.id as string}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="soft" className="text-[10.5px]">
                {ADDRESS_TYPE_LABELS[addr.addressType] ?? addr.addressType}
              </Badge>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-2">
              {addr.addressLine}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Preferences ─────────────────────────────────────────────────────

function PreferencesTab({
  preferences,
}: {
  preferences: CustomerPreference[];
}) {
  if (preferences.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Tag className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No preferences captured yet. Staff can record dietary, seating, or
            communication preferences over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Saved preferences
        </h3>
        <div className="overflow-hidden rounded-lg border border-line bg-line">
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
            {preferences.map((pref) => (
              <DetailRow
                key={pref.id as string}
                label={pref.preferenceKey}
                value={pref.preferenceValue}
              />
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function SummaryTile({
  icon,
  label,
  value,
  unit,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: string;
  tone?: "pos" | "neg" | "neutral";
}) {
  const toneClass =
    tone === "pos"
      ? "text-pos"
      : tone === "neg"
        ? "text-neg"
        : "text-muted-foreground";
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 text-[20px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
        <span>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] font-normal tracking-[0.02em] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {delta && (
        <div
          className={`mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] tabular-nums ${toneClass}`}
        >
          {delta}
        </div>
      )}
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
