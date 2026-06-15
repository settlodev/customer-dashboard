import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Boxes,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  MoreVertical,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KpiStrip } from "@/components/layouts/kpi-strip";
import { SectionCard, CardLink } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { MetricGrid, MetricCell } from "@/components/admin/shared/metric-cell";
import { PlanBadge, planTier } from "@/components/admin/shared/plan-badge";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import { LogInAsButton } from "@/components/admin/account-detail/log-in-as-button";
import { BusinessNotesPanel } from "@/components/admin/business-notes-panel";
import {
  compactNumber,
  formatDate,
  formatDateTime,
  timeSince,
} from "@/components/admin/shared/format";
import type {
  AdminBusinessDetail,
  AdminLocationListItem,
  AdminStoreListItem,
  AdminWarehouseListItem,
} from "@/types/admin/business";
import type {
  BusinessCustomerSegmentRow,
  BusinessHealthSnapshot,
  BusinessLifecycleSnapshot,
  BusinessLocationBreakdownRow,
  BusinessOverviewSnapshot,
} from "@/types/admin/business-intel";
import type {
  AdminBusinessFinancialsSummary,
  AdminBusinessInventorySummary,
} from "@/types/admin/business-operations";
import type {
  InvoicePage,
  SubscriptionItemResponse,
  SubscriptionResponse,
} from "@/types/admin/billing";
import type { BusinessNotePage } from "@/types/admin/business-note";
import type { InternalRole } from "@/types/types";

interface BusinessDetailViewProps {
  business: AdminBusinessDetail;
  locations: AdminLocationListItem[];
  warehouses: AdminWarehouseListItem[];
  stores: AdminStoreListItem[];
  subscription: SubscriptionResponse | null;
  invoices: InvoicePage | null;
  overviewToday: BusinessOverviewSnapshot | null;
  overview7d: BusinessOverviewSnapshot | null;
  overview30d: BusinessOverviewSnapshot | null;
  health: BusinessHealthSnapshot | null;
  lifecycle: BusinessLifecycleSnapshot | null;
  locationBreakdown: BusinessLocationBreakdownRow[];
  customerSegments: BusinessCustomerSegmentRow[];
  inventory: AdminBusinessInventorySummary | null;
  financials: AdminBusinessFinancialsSummary | null;
  notesPage: BusinessNotePage | null;
  rangeLabel: string;
  canBilling: boolean;
  currentUserId: string | null;
  currentUserRole: InternalRole | null;
}

const AV_GRADIENT = "linear-gradient(135deg,#F4A36C,#C25E26)";

function n(value: number | null | undefined): number {
  return value ?? 0;
}
function amt(value: number | null | undefined): string {
  return compactNumber(n(value));
}
function rel(value: string | null | undefined): string {
  return value ? timeSince(value) : "—";
}
function plusDays(iso: string | null | undefined, days: number): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  d.setDate(d.getDate() + days);
  return formatDate(d);
}
function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / 86_400_000);
}

export function BusinessDetailView({
  business,
  locations,
  warehouses,
  stores,
  subscription,
  invoices,
  overviewToday,
  overview7d,
  overview30d,
  health,
  lifecycle,
  locationBreakdown,
  customerSegments,
  inventory,
  financials,
  notesPage,
  rangeLabel,
  canBilling,
  currentUserId,
  currentUserRole,
}: BusinessDetailViewProps) {
  const currency = business.baseCurrency || "TZS";
  const industry = locations.find((l) => l.businessTypeName)?.businessTypeName ?? null;
  const plan = lifecycle?.current_package_name ?? null;
  const subStatus = subscription?.status ?? null;
  const trialLeft = daysLeft(subscription?.trialEndDate);
  const healthScore = health?.health_score != null ? Math.round(health.health_score) : null;

  // Subscriptions live per billable unit (location/warehouse/store); the
  // business is the invoice/consolidation level. The Subscription's `items`
  // are those per-unit lines — entityType isn't in the response yet (it's the
  // "unit data next" step), so we roll up count + MRR + plan mix here.
  const activeItems = (subscription?.items ?? []).filter(
    (i) => i.status === "ACTIVE",
  );
  const unitCount = activeItems.length;
  const itemsMrr = activeItems.reduce(
    (s, i) => s + (i.packageInfo?.basePrice ?? 0),
    0,
  );
  const planMixParts = (() => {
    const m = new Map<string, number>();
    for (const i of activeItems) {
      const p = i.packageInfo?.name ?? "—";
      m.set(p, (m.get(p) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, z) => z[1] - a[1])
      .map(([p, c]) => `${p} ×${c}`)
      .join(" · ");
  })();

  // Join the Billable-units rows to ALL non-REMOVED items (not just ACTIVE) so a
  // PAST_DUE / trial / suspended unit shows its real plan + status, not "no plan".
  // (Phase-2 Task 3's status rollup also consumes `liveItems`.)
  const liveItems = (subscription?.items ?? []).filter(
    (i) => i.status !== "REMOVED",
  );

  // Per-item billing status rolled up across this business's units (trial =
  // ACTIVE + a future trialEndDate). This replaces the legacy business-level
  // "Overall status".
  const statusRollup = (() => {
    const order = ["Active", "Trial", "Past due", "Suspended", "Expired", "Cancelled"];
    const m = new Map<string, number>();
    for (const i of liveItems) {
      const isTrial =
        i.status === "ACTIVE" &&
        !!i.trialEndDate &&
        new Date(i.trialEndDate).getTime() > Date.now();
      const label = isTrial
        ? "Trial"
        : i.status === "ACTIVE"
          ? "Active"
          : i.status === "PAST_DUE"
            ? "Past due"
            : i.status === "SUSPENDED"
              ? "Suspended"
              : i.status === "EXPIRED"
                ? "Expired"
                : "Cancelled";
      m.set(label, (m.get(label) ?? 0) + 1);
    }
    return order
      .filter((k) => m.has(k))
      .map((k) => `${m.get(k)} ${k}`)
      .join(" · ");
  })();
  const itemByEntity = new Map<string, SubscriptionItemResponse>();
  for (const i of liveItems) itemByEntity.set(i.entityId, i);
  const billableUnits = [
    ...locations.map((l) => ({
      id: l.id,
      type: "Location" as const,
      name: l.name,
      meta: l.identifier,
      item: itemByEntity.get(l.id) ?? null,
      href: `/locations/${l.id}`,
    })),
    ...warehouses.map((w) => ({
      id: w.id,
      type: "Warehouse" as const,
      name: w.name,
      meta: w.identifier,
      item: itemByEntity.get(w.id) ?? null,
      href: null as string | null, // warehouse detail page lands in Phase 4
    })),
    ...stores.map((s) => ({
      id: s.id,
      type: "Store" as const,
      name: s.name,
      meta: s.identifier,
      item: itemByEntity.get(s.id) ?? null,
      href: null as string | null, // store detail page lands in Phase 4
    })),
  ];

  // ── credit-readiness derivation ──────────────────────────────────────
  const hasPaid = !!lifecycle?.first_paid_order_at;
  const credit =
    !hasPaid
      ? { label: "Insufficient history", tone: "warn" as const }
      : healthScore != null && healthScore < 40
        ? { label: "High risk", tone: "neg" as const }
        : healthScore != null && healthScore >= 60
          ? { label: "Eligible", tone: "pos" as const }
          : { label: "Building", tone: "warn" as const };
  const completed30 = n(overview30d?.completed_orders);

  // ── churn risk ───────────────────────────────────────────────────────
  const churnP = health?.churn_probability ?? null;
  const churn =
    churnP == null
      ? { label: "—", color: "var(--muted-2)" }
      : churnP < 0.33
        ? { label: "Low", color: "hsl(var(--pos))" }
        : churnP < 0.66
          ? { label: "Medium", color: "hsl(var(--warn))" }
          : { label: "High", color: "hsl(var(--neg))" };

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-4">
          <span
            className="grid h-[60px] w-[60px] flex-shrink-0 place-items-center rounded-2xl text-white shadow-[0_6px_16px_-6px_rgba(194,94,38,0.5)]"
            style={{ background: AV_GRADIENT }}
          >
            <Store className="h-7 w-7" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[25px] font-bold tracking-[-0.03em] text-ink">
                {business.name}
              </h1>
              <StatusBadge active={business.active} />
              {subStatus && <SubBadge status={subStatus} />}
            </div>
            <p className="mt-1.5 font-mono text-[12.5px] text-muted-foreground">
              {business.identifier}
              <span className="text-ink-3"> · {currency}</span>
              {industry && <span> · {industry}</span>}
              {business.accountFullName && (
                <>
                  {" · owned by "}
                  <Link
                    href={`/accounts/${business.accountId}`}
                    className="text-ink-3 underline underline-offset-2 hover:text-[#C25E26]"
                  >
                    {business.accountFullName}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/businesses">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="#units">
              <MapPin className="h-4 w-4" />
              Units
            </a>
          </Button>
          <LogInAsButton accountId={business.accountId} />
          {canBilling && (
            <Button asChild variant="accent" size="sm">
              <Link href={`/businesses/${business.id}/billing`}>
                <CreditCard className="h-4 w-4" />
                Manage billing
              </Link>
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="More">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Credit-readiness banner ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card px-[18px] py-4">
        <span className="grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-xl bg-warn-tint text-warn">
          <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
            Credit-readiness signal
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                credit.tone === "neg"
                  ? "bg-neg-tint text-neg"
                  : credit.tone === "pos"
                    ? "bg-pos-tint text-pos"
                    : "bg-warn-tint text-warn",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {credit.label}
            </span>
          </div>
          <p className="mt-1 max-w-[880px] text-[13px] text-ink-3">
            <b className="font-semibold text-ink">
              {amt(inventory?.totalStockValue)} {currency} inventory loaded
            </b>{" "}
            and {n(business.activeLocationCount)} active location
            {business.activeLocationCount === 1 ? "" : "s"}, but{" "}
            {completed30 > 0
              ? `${completed30} completed sales in the last 30 days`
              : "no completed sales"}
            {trialLeft != null && trialLeft >= 0
              ? ` and on a trial that ends in ${trialLeft} days`
              : ""}
            . <b className="font-semibold text-ink">Re-assess for credit after 30 days of trading.</b>
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
            Re-assess on
          </div>
          <div className="mt-1 font-mono text-[13px] font-semibold text-ink">
            {plusDays(business.createdAt, 30)}
          </div>
        </div>
      </div>

      {/* ── Profile + address ───────────────────────────────── */}
      <SectionCard>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          <div>
            <p className="mb-3.5 text-[13px] font-semibold text-ink">Profile</p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Name" value={business.name} />
              <Field label="Identifier" value={business.identifier} mono />
              <Field label="Slug" value={business.slug} mono />
              <Field label="Base currency" value={business.baseCurrency} mono />
              <Field label="Phone" value={business.phoneNumber} mono />
              <Field label="Email" value={business.email} mono />
              <Field label="Website" value={business.website} mono />
              <Field label="Industry" value={industry} />
            </div>
          </div>
          <div>
            <p className="mb-3.5 text-[13px] font-semibold text-ink">Address &amp; country</p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Country" value={business.countryName ?? business.countryCode} />
              <Field label="Region" value={business.region} />
              <Field label="District" value={business.district} />
              <Field label="Ward" value={business.ward} />
              <Field label="Address" value={business.address} />
              <Field label="Postal code" value={business.postalCode} mono />
            </div>
            <p className="mb-3.5 mt-6 text-[13px] font-semibold text-ink">Timestamps</p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Created" value={formatDateTime(business.createdAt)} />
              <Field label="Updated" value={formatDateTime(business.updatedAt)} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── KPI strip ───────────────────────────────────────── */}
      <KpiStrip cols={6}>
        <KCell
          icon={<Clock className="h-[13px] w-[13px]" />}
          label="Health"
          value={
            <>
              {healthScore ?? "—"}{" "}
              <span className="text-[11px] font-normal text-muted-2">/ 100</span>
            </>
          }
          sub={
            healthScore == null
              ? "no score yet"
              : healthScore < 40
                ? "New · building"
                : healthScore < 70
                  ? "developing"
                  : "healthy"
          }
          subTone="warn"
        />
        <KCell
          label="Churn risk"
          value={churn.label}
          valueColor={churn.color}
          sub={
            churnP == null
              ? "score pending"
              : n(lifecycle?.days_since_last_order) <= 7
                ? "recently active"
                : "quiet"
          }
        />
        <KCell
          label="30-day net sales"
          currency={currency}
          value={amt(overview30d?.net_sales)}
          sub={`${n(overview30d?.total_orders)} order${n(overview30d?.total_orders) === 1 ? "" : "s"}`}
        />
        <KCell
          label="Stock value"
          currency={currency}
          value={amt(inventory?.totalStockValue)}
          sub={`${n(inventory?.totalQuantityOnHand).toLocaleString()} units`}
        />
        {canBilling ? (
          <KCell
            label="Subscriptions"
            value={String(unitCount)}
            sub={`${currency} ${amt(itemsMrr)} MRR`}
          />
        ) : (
          <KCell
            label="Plan"
            value={plan ?? "—"}
            sub={subStatus ? subStatus.toLowerCase() : "—"}
          />
        )}
        <KCell
          label="Last order"
          value={rel(lifecycle?.last_order_at)}
          sub={`${n(lifecycle?.days_since_last_order)} days since`}
          subTone={n(lifecycle?.days_since_last_order) === 0 ? "pos" : "muted"}
        />
      </KpiStrip>

      {/* ── Two columns ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* LEFT */}
        <div className="space-y-4">
          <SectionCard
            title={<CardTitle icon={<Activity className="h-[17px] w-[17px]" />}>Revenue &amp; orders</CardTitle>}
            action={<span className="font-mono text-[11px] text-muted-foreground">{rangeLabel} · {currency}</span>}
          >
            <MetricGrid cols={4}>
              <MetricCell label="Today net sales" currency={currency} value={amt(overviewToday?.net_sales)} sub={`${n(overviewToday?.total_orders)} order${n(overviewToday?.total_orders) === 1 ? "" : "s"}`} />
              <MetricCell label="7-day net sales" currency={currency} value={amt(overview7d?.net_sales)} sub={`AOV ${amt(overview7d?.avg_order_value)}`} />
              <MetricCell label="30-day net sales" currency={currency} value={amt(overview30d?.net_sales)} sub={`${n(overview30d?.total_orders)} order${n(overview30d?.total_orders) === 1 ? "" : "s"}`} />
              <MetricCell label="30-day gross profit" currency={currency} value={amt(overview30d?.gross_profit)} sub="—" />
            </MetricGrid>
            <div className="mt-2.5">
              <MetricGrid cols={4}>
                <MetricCell small label="30-day customers" value={n(overview30d?.unique_customers).toLocaleString()} sub={`${n(overview30d?.active_staff)} active staff`} />
                <MetricCell small label="Cancelled 30d" value={n(overview30d?.cancelled_orders).toLocaleString()} />
                <MetricCell small label="Refunded 30d" value={n(overview30d?.total_refund_count).toLocaleString()} sub={`${n(overview30d?.total_refunded_amount) > 0 ? amt(overview30d?.total_refunded_amount) : 0} refunds`} />
                <MetricCell small label="Tips 30d" value={amt(overview30d?.total_tips)} />
              </MetricGrid>
            </div>
          </SectionCard>

          <SectionCard
            title={<CardTitle icon={<Boxes className="h-[17px] w-[17px]" />}>Inventory on hand</CardTitle>}
            action={<span className="font-mono text-[11px] text-muted-foreground">oldest batch · {rel(inventory?.oldestActiveReceivedDate)}</span>}
          >
            <MetricGrid cols={4}>
              <MetricCell label="Total stock value" currency={currency} value={amt(inventory?.totalStockValue)} sub={`${n(inventory?.totalQuantityOnHand).toLocaleString()} units`} />
              <MetricCell small label="Active batches" value={n(inventory?.activeBatchCount).toLocaleString()} sub={`${n(inventory?.activeLocationCount)} location${n(inventory?.activeLocationCount) === 1 ? "" : "s"}`} />
              <MetricCell small label="Last stock-in" value={rel(inventory?.lastReceivedDate)} sub={inventory?.lastReceivedDate ? formatDate(inventory.lastReceivedDate) : "—"} />
              <MetricCell small label="Recalled batches" value={n(inventory?.recalledBatchCount).toLocaleString()} sub={n(inventory?.recalledBatchCount) === 0 ? "none" : undefined} subTone={n(inventory?.recalledBatchCount) === 0 ? "pos" : "muted"} />
            </MetricGrid>
          </SectionCard>

          <SectionCard
            title={<CardTitle icon={<Wallet className="h-[17px] w-[17px]" />}>Financials &amp; payables</CardTitle>}
            action={<span className="font-mono text-[11px] text-muted-foreground">{rangeLabel}</span>}
          >
            <MetricGrid cols={4}>
              <MetricCell label="Revenue (period)" currency={currency} value={amt(financials?.revenuePeriod)} sub={`${n(financials?.postedJournalEntriesPeriod)} journal entries`} />
              <MetricCell label="Expenses paid" currency={currency} value={amt(financials?.expensesPaidPeriod)} sub={`${n(financials?.postedExpensesPeriod)} expenses`} />
              <MetricCell label="Net cash flow" currency={currency} value={amt(financials?.netCashFlowPeriod)} sub={n(financials?.netCashFlowPeriod) === 0 ? "neutral" : n(financials?.netCashFlowPeriod) > 0 ? "positive" : "negative"} />
              <MetricCell label="A/P outstanding" currency={currency} value={amt(financials?.apOutstanding)} sub={n(financials?.apOutstanding) === 0 ? "current" : `${amt(financials?.apDays90Plus)} 90d+`} subTone={n(financials?.apOutstanding) === 0 ? "pos" : "muted"} />
            </MetricGrid>
            <DefList className="mt-1.5">
              <DefRow label="Last journal entry" value={financials?.lastJournalEntryAt ? formatDate(financials.lastJournalEntryAt) : "—"} tone={financials?.lastJournalEntryAt ? "default" : "dim"} />
              <DefRow label="Last expense" value={financials?.lastExpenseAt ? formatDate(financials.lastExpenseAt) : "Never"} tone={financials?.lastExpenseAt ? "default" : "dim"} />
            </DefList>
          </SectionCard>

          <SectionCard
            title={<CardTitle icon={<MapPin className="h-[17px] w-[17px]" />}>Per-location performance</CardTitle>}
            action={<span className="font-mono text-[11px] text-muted-foreground">30 days · by net sales</span>}
          >
            {locationBreakdown.length === 0 ? (
              <Empty>No per-location sales in this window yet.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="[&>th]:border-b [&>th]:border-line [&>th]:px-3.5 [&>th]:pb-2.5 [&>th]:text-right [&>th]:font-mono [&>th]:text-[10px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em] [&>th]:text-muted-foreground [&>th:first-child]:text-left">
                      <th>Location</th><th>Orders</th><th>Completed</th><th>Net sales</th><th>Gross profit</th><th>AOV</th><th>Staff</th><th>Customers</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-line [&>tr:last-child>td]:border-b-0 [&>tr>td]:px-3.5 [&>tr>td]:py-3 [&>tr>td]:text-right [&>tr>td]:font-mono [&>tr>td]:text-[13px] [&>tr>td]:text-ink [&>tr>td:first-child]:text-left">
                    {locationBreakdown.map((r) => (
                      <tr key={r.location_id}>
                        <td className="!font-sans !font-semibold tracking-[-0.01em]">{r.location_name ?? "—"}</td>
                        <td>{n(r.total_orders)}</td>
                        <td className={n(r.completed_orders) === 0 ? "text-muted-2" : ""}>{n(r.completed_orders)}</td>
                        <td>{amt(r.net_sales)}</td>
                        <td className="text-pos">{amt(r.gross_profit)}</td>
                        <td>{amt(r.avg_order_value)}</td>
                        <td>{n(r.active_staff)}</td>
                        <td className={n(r.unique_customers) === 0 ? "text-muted-2" : ""}>{n(r.unique_customers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title={<CardTitle icon={<Users className="h-[17px] w-[17px]" />}>Customer segments (RFM)</CardTitle>}>
            {customerSegments.length === 0 ? (
              <Empty>No customer segmentation yet — appears after the first completed sales.</Empty>
            ) : (
              <DefList>
                {customerSegments.map((s) => (
                  <DefRow
                    key={s.rfm_segment}
                    label={`${s.rfm_segment} · ${n(s.customer_count)} customers`}
                    value={`${currency} ${amt(s.segment_revenue)}`}
                  />
                ))}
              </DefList>
            )}
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <SectionCard
            title="Health sub-scores"
            action={<span className="font-mono text-[11px] text-muted-foreground">{healthScore ?? "—"} / 100</span>}
          >
            {healthScore == null && (
              <p className="mb-2.5 font-mono text-[11px] text-muted-2">
                Health is scored by a nightly model — no score computed for this
                business yet.
              </p>
            )}
            <div className="flex flex-col">
              <ScoreBar name="Revenue" score={health?.revenue_score ?? null} />
              <ScoreBar name="Engagement" score={health?.engagement_score ?? null} />
              <ScoreBar name="Growth" score={health?.growth_score ?? null} />
              <ScoreBar name="Retention" score={health?.retention_score ?? null} />
              <ScoreBar name="Operational" score={health?.operational_score ?? null} />
            </div>
            <DefList className="mt-2">
              <DefRow label="Lifetime orders" value={n(lifecycle?.total_orders).toLocaleString()} />
              <DefRow label="Lifetime revenue" value={`${currency} ${amt(lifecycle?.total_revenue)}`} />
              <DefRow label="First product" value={rel(lifecycle?.first_product_at)} tone={lifecycle?.first_product_at ? "default" : "dim"} />
              <DefRow label="First order" value={rel(lifecycle?.first_order_at)} tone={lifecycle?.first_order_at ? "default" : "dim"} />
              <DefRow label="First paid order" value={lifecycle?.first_paid_order_at ? rel(lifecycle.first_paid_order_at) : "None yet"} tone={lifecycle?.first_paid_order_at ? "default" : "dim"} />
            </DefList>
          </SectionCard>

          {canBilling && (
            <SectionCard
              title="Billing & subscriptions"
              subtitle="rolled up across this business's units · invoices issued here"
              action={<CardLink href={`/businesses/${business.id}/billing`}>Manage</CardLink>}
            >
              <DefList>
                <DefRow label="Active subscriptions" value={String(unitCount)} />
                <DefRow label="MRR" value={`${currency} ${amt(itemsMrr)}`} />
                {planMixParts && (
                  <DefRow
                    label="Active plan mix"
                    rawValue
                    value={<span className="font-mono text-[12px] text-ink">{planMixParts}</span>}
                  />
                )}
                <DefRow
                  label="Unit statuses"
                  rawValue
                  value={
                    statusRollup ? (
                      <span className="font-mono text-[12px] text-ink">{statusRollup}</span>
                    ) : (
                      <span className="text-[12.5px] text-muted-2">—</span>
                    )
                  }
                />
                <DefRow label="Trial window" value={subscription?.trialStartDate ? `${formatDate(subscription.trialStartDate)} → ${formatDate(subscription.trialEndDate)}` : "—"} tone={subscription?.trialStartDate ? "default" : "dim"} />
                <DefRow label="Paid through" value={subscription?.paidThrough ? formatDate(subscription.paidThrough) : "—"} tone={subscription?.paidThrough ? "default" : "dim"} />
                <DefRow label="Next billing" value={subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : "—"} tone={subscription?.nextBillingDate ? "default" : "dim"} />
                <DefRow label="Recent invoices" value={invoices && invoices.totalElements > 0 ? `${invoices.totalElements} on file` : "None on file"} tone={invoices && invoices.totalElements > 0 ? "default" : "dim"} />
              </DefList>
            </SectionCard>
          )}

          <SectionCard
            title={<CardTitle icon={<MapPin className="h-[16px] w-[16px]" />}>Billable units</CardTitle>}
            subtitle="each location / warehouse / store carries its own plan"
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {locations.length} loc · {warehouses.length} wh · {stores.length} store
              </span>
            }
            id="units"
          >
            {billableUnits.length === 0 ? (
              <Empty>No billable units registered.</Empty>
            ) : (
              <div className="flex flex-col">
                {billableUnits.map((u) => {
                  const plan = u.item?.packageInfo?.name ?? null;
                  const mrr = u.item?.packageInfo?.basePrice ?? null;
                  const inner = (
                    <>
                      <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-[9px] bg-primary/12 text-[#C25E26]">
                        {u.type === "Warehouse" ? (
                          <Boxes className="h-[17px] w-[17px]" strokeWidth={1.5} />
                        ) : u.type === "Store" ? (
                          <Store className="h-[17px] w-[17px]" strokeWidth={1.5} />
                        ) : (
                          <MapPin className="h-[17px] w-[17px]" strokeWidth={1.5} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-ink">{u.name}</div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {u.type} · {u.meta}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {mrr != null && (
                          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                            {currency} {amt(mrr)}
                          </span>
                        )}
                        {plan ? (
                          <PlanBadge tier={planTier(plan)} label={plan} />
                        ) : (
                          <span className="font-mono text-[10.5px] text-muted-2">no plan</span>
                        )}
                        <SubscriptionItemStatusBadge status={u.item?.status ?? null} small />
                        {u.href && <ChevronRight className="h-4 w-4 text-muted-2" />}
                      </div>
                    </>
                  );
                  return u.href ? (
                    <Link
                      key={u.id}
                      href={u.href}
                      className="flex items-center gap-3 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

        </div>
      </div>

      {/* ── Staff notes (existing wired component) ──────────── */}
      <BusinessNotesPanel
        businessId={business.id}
        initialPage={notesPage}
        error={null}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}

// ── inline pieces ──────────────────────────────────────────────────────

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

function StatusBadge({ active, small }: { active: boolean; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        active ? "bg-pos-tint text-pos" : "bg-neg-tint text-neg",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SubBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "TRIAL"
      ? "bg-[#2563EB]/10 text-[#2563EB]"
      : s === "ACTIVE"
        ? "bg-pos-tint text-pos"
        : "bg-warn-tint text-warn";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </span>
  );
}

function ScoreBar({ name, score }: { name: string; score: number | null }) {
  const v = score == null ? null : Math.round(score);
  const color =
    v == null
      ? "transparent"
      : v < 30
        ? "hsl(var(--neg))"
        : v < 60
          ? "hsl(var(--warn))"
          : "hsl(var(--pos))";
  return (
    <div className="grid grid-cols-[80px_1fr_32px] items-center gap-3 py-2 sm:grid-cols-[96px_1fr_34px]">
      <div className="text-[13px] text-ink-2">{name}</div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, backgroundColor: color }} />
      </div>
      <div className={cn("text-right font-mono text-[12px] font-semibold tabular-nums", v == null && "font-medium text-muted-2")}>
        {v == null ? "—" : v}
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 tracking-[-0.01em]",
          mono ? "break-all font-mono text-[13px]" : "text-[14px]",
          empty ? "text-muted-2" : "text-ink",
        )}
      >
        {empty ? "—" : value}
      </div>
    </div>
  );
}

function Empty({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-dashed border-line-2 p-[22px] text-center text-[13px] text-muted-foreground", className)}>
      {children}
    </div>
  );
}

// ── KPI strip cell ──────────────────────────────────────────────────────
function KCell({
  icon,
  label,
  value,
  currency,
  valueColor,
  sub,
  subTone = "muted",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  currency?: string;
  valueColor?: string;
  sub?: React.ReactNode;
  subTone?: "muted" | "pos" | "warn";
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-[18px]">
      <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {icon && <span className="text-muted-2">{icon}</span>}
        {label}
      </div>
      <div
        className="mt-2 flex items-baseline gap-1.5 text-[16px] font-bold tracking-[-0.02em] tabular-nums"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {currency && <span className="text-[11px] font-semibold text-ink-3">{currency}</span>}
        <span className={valueColor ? "" : "text-ink"}>{value}</span>
      </div>
      {sub != null && (
        <div
          className={cn(
            "mt-1.5 font-mono text-[11px]",
            subTone === "pos" ? "text-pos" : subTone === "warn" ? "text-warn" : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
