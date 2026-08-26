import React from "react";
import Link from "next/link";
import {
  Activity,
  Boxes,
  Clock,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { subscriptionItemMrr } from "@/lib/helpers";
import {
  ACTIVITY_TONE,
  activityBadge,
  daysSinceLastOrder,
  formatLastOrder,
} from "@/lib/admin/lifecycle";
import { KpiStrip } from "@/components/layouts/kpi-strip";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { MetricGrid, MetricCell } from "@/components/admin/shared/metric-cell";
import { PlanBadge, planTier } from "@/components/admin/shared/plan-badge";
import { HealthScoreBars, churnBand } from "@/components/admin/shared/score-bar";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import { LocationBillingActions } from "@/components/admin/location-detail/location-billing-actions";
import {
  compactNumber,
  formatDate,
  formatDateTime,
  timeSince,
} from "@/components/admin/shared/format";

import type { AdminLocationDetail } from "@/types/admin/business";
import type {
  SubscriptionItemResponse,
  SubscriptionResponse,
} from "@/types/admin/billing";
import type {
  BusinessHealthSnapshot,
  BusinessOverviewSnapshot,
  LocationLifecycleSnapshot,
  LocationStaffRow,
} from "@/types/admin/business-intel";
import type { AdminBusinessFinancialsSummary } from "@/types/admin/business-operations";
import type { EntityStockSummary } from "@/types/admin/inventory";

/**
 * Location detail — deliberately the same shape as {@code BusinessDetailView}.
 *
 * A location is the thing that actually trades: it holds the subscription, rings
 * up the orders, carries the stock and posts the books. The business figure is
 * only the sum of its locations. So a location gets the full scorecard rather
 * than a reduced one, laid out identically so a staff member can read a business
 * page and a location page the same way — and so the two numbers can be compared
 * directly when they disagree.
 *
 * This replaced a tabbed view. Tabs hid exactly the comparison that matters:
 * you could not see a location's health next to its sales next to what it owes
 * without clicking between three panes.
 */

interface LocationDetailViewProps {
  location: AdminLocationDetail;
  businessId: string;
  businessName: string | null;
  /** Owning business's base currency — money here is in the business's books. */
  currency: string;
  subscription: SubscriptionResponse | null;
  /** This location's own subscription item, or null when it has none. */
  item: SubscriptionItemResponse | null;
  overviewToday: BusinessOverviewSnapshot | null;
  overview7d: BusinessOverviewSnapshot | null;
  overview30d: BusinessOverviewSnapshot | null;
  lifecycle: LocationLifecycleSnapshot | null;
  health: BusinessHealthSnapshot | null;
  financials: AdminBusinessFinancialsSummary | null;
  stock: EntityStockSummary | null;
  staff: LocationStaffRow[];
  rangeLabel: string;
  canBilling: boolean;
  /** SYSTEM_ADMIN — may override-extend a paid/used entity's trial. */
  isSuperAdmin: boolean;
}

// ── formatting helpers, matching the business detail's ───────────────────────

function n(value: number | null | undefined): number {
  return value ?? 0;
}
function amt(value: number | null | undefined): string {
  return compactNumber(n(value));
}
function rel(value: string | null | undefined): string {
  return value ? timeSince(value) : "—";
}
function plural(count: number, singular: string, pluralWord?: string): string {
  const word = count === 1 ? singular : (pluralWord ?? `${singular}s`);
  return `${count.toLocaleString()} ${word}`;
}

/**
 * The health model stores its recommendations as a JSON array in a String
 * column. Parse defensively — a malformed value means no advice shown, never a
 * blank page.
 */
function parseRecommendations(health: BusinessHealthSnapshot | null): string[] {
  const raw = health?.recommendations;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((r): r is string => typeof r === "string")
      : [];
  } catch {
    return [];
  }
}

export function LocationDetailView({
  location,
  businessId,
  businessName,
  currency,
  subscription,
  item,
  overviewToday,
  overview7d,
  overview30d,
  lifecycle,
  health,
  financials,
  stock,
  staff,
  rangeLabel,
  canBilling,
  isSuperAdmin,
}: LocationDetailViewProps) {
  const healthScore =
    health?.health_score != null ? Math.round(health.health_score) : null;
  const churn = churnBand(health?.churn_probability);
  const recommendations = parseRecommendations(health);
  const activity = activityBadge(lifecycle, "Location");
  // null = never traded. The location rollup encodes that as NULL rather than
  // the business rollup's 9999 sentinel, but read it through the shared helper
  // either way.
  const lastOrderDays = daysSinceLastOrder(lifecycle);

  const plan = item?.packageInfo?.name ?? lifecycle?.current_package_name ?? null;
  const mrr = item ? subscriptionItemMrr(item) : n(lifecycle?.billing_mrr);
  const isTrialActive =
    item?.status === "ACTIVE" &&
    !!item.trialEndDate &&
    new Date(item.trialEndDate).getTime() > Date.now();
  // Bundled units inherit the parent location's plan and addons — no independent
  // billing actions. Billing enforces this too; this only hides the buttons.
  const showBillingActions =
    canBilling && !!subscription?.id && !!item && !item.isBundled;

  const hasTraded = n(lifecycle?.total_orders) > 0 || n(overview30d?.total_orders) > 0;

  return (
    // space-y-4, matching BusinessDetailView's root: PageBody's default space-y-6
    // would make this page looser than the business page it deliberately mirrors.
    <div className="space-y-4">
      {/* ── Profile + address ───────────────────────────────── */}
      <SectionCard>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          <div>
            <p className="mb-3.5 text-[13px] font-semibold text-ink">Profile</p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Name" value={location.name} />
              <Field label="Identifier" value={location.identifier} mono />
              <Field label="Slug" value={location.slug} mono />
              <Field
                label="Business"
                value={
                  <Link
                    href={`/businesses/${businessId}`}
                    className="hover:text-[#C25E26]"
                  >
                    {businessName ?? "—"}
                  </Link>
                }
              />
              <Field label="Phone" value={location.phoneNumber} mono />
              <Field label="Email" value={location.email} mono />
              <Field label="Website" value={location.website} mono />
              <Field label="Industry" value={location.businessTypeName} />
            </div>
          </div>
          <div>
            <p className="mb-3.5 text-[13px] font-semibold text-ink">
              Address &amp; country
            </p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field
                label="Country"
                value={location.countryName ?? location.countryCode}
              />
              <Field label="Region" value={location.region} />
              <Field label="District" value={location.district} />
              <Field label="Ward" value={location.ward} />
              <Field label="Address" value={location.address} />
              <Field label="Postal code" value={location.postalCode} mono />
              <Field label="Timezone" value={location.timezone} mono />
              <Field
                label="Status"
                value={location.active ? "Active" : "Inactive"}
              />
            </div>
            <p className="mb-3.5 mt-6 text-[13px] font-semibold text-ink">
              Timestamps
            </p>
            <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Created" value={formatDateTime(location.createdAt)} />
              <Field label="Updated" value={formatDateTime(location.updatedAt)} />
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
                ? "at risk"
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
            health?.churn_probability == null
              ? "score pending"
              : lastOrderDays !== null && lastOrderDays <= 7
                ? "recently active"
                : "quiet"
          }
        />
        <KCell
          label="30-day net sales"
          currency={currency}
          value={amt(overview30d?.net_sales)}
          sub={plural(n(overview30d?.total_orders), "order")}
        />
        <KCell
          label="Stock value"
          currency={currency}
          value={amt(stock?.totalStockValue)}
          sub={`${n(stock?.totalQuantityOnHand).toLocaleString()} units`}
        />
        <KCell
          label={canBilling ? "Plan · MRR" : "Plan"}
          value={plan ?? "—"}
          sub={
            canBilling
              ? `${currency} ${amt(mrr)}${item?.isBundled ? " · bundled" : ""}`
              : (item?.status?.toLowerCase() ?? "no subscription")
          }
        />
        <KCell
          label="Last order"
          value={lastOrderDays === null ? "Never" : formatLastOrder(lastOrderDays)}
          sub={
            lastOrderDays === null
              ? "no orders yet"
              : `${lastOrderDays} days since`
          }
          subTone={lastOrderDays === 0 ? "pos" : "muted"}
        />
      </KpiStrip>

      {/* ── Two columns ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        {/* LEFT */}
        <div className="space-y-4">
          <SectionCard
            title={
              <CardTitle icon={<Activity className="h-[17px] w-[17px]" />}>
                Revenue &amp; orders
              </CardTitle>
            }
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {rangeLabel} · {currency}
              </span>
            }
          >
            {!hasTraded ? (
              <Empty>This location has not rung up a sale yet.</Empty>
            ) : (
              <>
                <MetricGrid cols={4}>
                  <MetricCell
                    label="Today net sales"
                    currency={currency}
                    value={amt(overviewToday?.net_sales)}
                    sub={plural(n(overviewToday?.total_orders), "order")}
                  />
                  <MetricCell
                    label="7-day net sales"
                    currency={currency}
                    value={amt(overview7d?.net_sales)}
                    sub={`AOV ${amt(overview7d?.avg_order_value)}`}
                  />
                  <MetricCell
                    label="30-day net sales"
                    currency={currency}
                    value={amt(overview30d?.net_sales)}
                    sub={plural(n(overview30d?.total_orders), "order")}
                  />
                  <MetricCell
                    label="30-day gross profit"
                    currency={currency}
                    value={amt(overview30d?.gross_profit)}
                    sub={`cost ${amt(overview30d?.total_cost)}`}
                  />
                </MetricGrid>
                <div className="mt-2.5">
                  <MetricGrid cols={4}>
                    <MetricCell
                      small
                      label="30-day customers"
                      value={n(overview30d?.unique_customers).toLocaleString()}
                      sub={`${n(overview30d?.active_staff)} active staff`}
                    />
                    <MetricCell
                      small
                      label="Cancelled 30d"
                      value={n(overview30d?.cancelled_orders).toLocaleString()}
                    />
                    <MetricCell
                      small
                      label="Refunded 30d"
                      value={n(overview30d?.total_refund_count).toLocaleString()}
                      sub={`${amt(overview30d?.total_refunded_amount)} refunded`}
                    />
                    <MetricCell
                      small
                      label="Tips 30d"
                      value={amt(overview30d?.total_tips)}
                    />
                  </MetricGrid>
                </div>
              </>
            )}
          </SectionCard>

          {/*
            The closing-balance components, straight off this location's own
            transaction and expense facts. Distinct from "Financials & payables"
            below, which is the posted books from Accounting.
          */}
          <SectionCard
            title={
              <CardTitle icon={<Wallet className="h-[17px] w-[17px]" />}>
                Money in &amp; out
              </CardTitle>
            }
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {rangeLabel} · {currency}
              </span>
            }
          >
            <MetricGrid cols={4}>
              <MetricCell
                label="Transactions taken"
                currency={currency}
                value={amt(overview30d?.transactions_amount)}
                sub="incl. tips & prepayments"
              />
              <MetricCell
                label="Expenses paid"
                currency={currency}
                value={amt(overview30d?.expenses_paid)}
              />
              <MetricCell
                small
                label="Complimentary"
                value={amt(overview30d?.complimentary_amount)}
              />
              <MetricCell
                small
                label="Signed bills"
                value={amt(overview30d?.signed_bill_amount)}
              />
            </MetricGrid>
          </SectionCard>

          <SectionCard
            title={
              <CardTitle icon={<Boxes className="h-[17px] w-[17px]" />}>
                Inventory on hand
              </CardTitle>
            }
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                last movement · {rel(stock?.lastMovementAt)}
              </span>
            }
          >
            {!stock ? (
              <Empty>Couldn&apos;t load stock for this location.</Empty>
            ) : (
              <>
                <MetricGrid cols={4}>
                  <MetricCell
                    label="Total stock value"
                    currency={currency}
                    value={amt(stock.totalStockValue)}
                    sub={`${n(stock.totalQuantityOnHand).toLocaleString()} units`}
                  />
                  <MetricCell
                    small
                    label="Products"
                    value={n(stock.productCount).toLocaleString()}
                    sub={`${n(stock.variantCount).toLocaleString()} stock items`}
                  />
                  <MetricCell
                    small
                    label="Low stock"
                    value={n(stock.lowStockCount).toLocaleString()}
                    subTone={stock.lowStockCount === 0 ? "pos" : "muted"}
                    sub={stock.lowStockCount === 0 ? "none" : undefined}
                  />
                  <MetricCell
                    small
                    label="Out of stock"
                    value={n(stock.outOfStockCount).toLocaleString()}
                    subTone={stock.outOfStockCount === 0 ? "pos" : "muted"}
                    sub={stock.outOfStockCount === 0 ? "none" : undefined}
                  />
                </MetricGrid>
                {stock.lowStockItems.length > 0 && (
                  <DefList className="mt-1.5">
                    {stock.lowStockItems.slice(0, 5).map((row) => (
                      <DefRow
                        key={row.variantId}
                        label={row.name}
                        value={`${amt(row.available)} left · ≤ ${amt(row.lowStockThreshold)}`}
                      />
                    ))}
                  </DefList>
                )}
              </>
            )}
          </SectionCard>

          <SectionCard
            title={
              <CardTitle icon={<Wallet className="h-[17px] w-[17px]" />}>
                Financials &amp; payables
              </CardTitle>
            }
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {rangeLabel}
              </span>
            }
          >
            {!financials ? (
              <Empty>Couldn&apos;t load this location&apos;s books.</Empty>
            ) : (
              <>
                <MetricGrid cols={4}>
                  <MetricCell
                    label="Revenue (period)"
                    currency={currency}
                    value={amt(financials.revenuePeriod)}
                    sub={plural(
                      financials.postedJournalEntriesPeriod,
                      "journal entry",
                      "journal entries",
                    )}
                  />
                  <MetricCell
                    label="Expenses paid"
                    currency={currency}
                    value={amt(financials.expensesPaidPeriod)}
                    sub={plural(financials.approvedExpensesPeriod, "expense")}
                  />
                  <MetricCell
                    label="Net cash flow"
                    currency={currency}
                    value={amt(financials.netCashFlowPeriod)}
                    sub={
                      financials.netCashFlowPeriod === 0
                        ? "neutral"
                        : financials.netCashFlowPeriod > 0
                          ? "positive"
                          : "negative"
                    }
                  />
                  <MetricCell
                    label="A/P outstanding"
                    currency={currency}
                    value={amt(financials.apOutstanding)}
                    sub={
                      financials.apOutstanding === 0
                        ? "current"
                        : `${amt(financials.apDays90Plus)} 90d+`
                    }
                    subTone={financials.apOutstanding === 0 ? "pos" : "muted"}
                  />
                </MetricGrid>
                <DefList className="mt-1.5">
                  <DefRow
                    label="Last journal entry"
                    value={
                      financials.lastJournalEntryAt
                        ? formatDate(financials.lastJournalEntryAt)
                        : "Never"
                    }
                    tone={financials.lastJournalEntryAt ? "default" : "dim"}
                  />
                  <DefRow
                    label="Last expense"
                    value={
                      financials.lastExpenseAt
                        ? formatDate(financials.lastExpenseAt)
                        : "Never"
                    }
                    tone={financials.lastExpenseAt ? "default" : "dim"}
                  />
                </DefList>
              </>
            )}
          </SectionCard>

          {/*
            Ageing is as-of-today, not period-bounded, at either grain: an
            unsettled bill is outstanding now, not "outstanding during the
            window". Only rendered when something is actually owed.
          */}
          {financials && financials.apOutstanding > 0 && (
            <SectionCard
              title="Payables ageing"
              action={
                <span className="font-mono text-[11px] text-muted-foreground">
                  as of today · {currency}
                </span>
              }
            >
              <MetricGrid cols={4}>
                <MetricCell small label="Current" value={amt(financials.apCurrent)} />
                <MetricCell small label="1-30 days" value={amt(financials.apDays30)} />
                <MetricCell small label="31-60 days" value={amt(financials.apDays60)} />
                <MetricCell small label="61-90 days" value={amt(financials.apDays90)} />
              </MetricGrid>
              <div className="mt-2.5">
                <MetricGrid cols={2}>
                  <MetricCell
                    label="90+ days"
                    currency={currency}
                    value={amt(financials.apDays90Plus)}
                    sub={financials.apDays90Plus > 0 ? "overdue" : "none"}
                  />
                  <MetricCell
                    label="Total owed"
                    currency={currency}
                    value={amt(financials.apOutstanding)}
                  />
                </MetricGrid>
              </div>
            </SectionCard>
          )}

          <SectionCard
            title={
              <CardTitle icon={<Users className="h-[17px] w-[17px]" />}>
                Staff at this location
              </CardTitle>
            }
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {rangeLabel} · by revenue
              </span>
            }
          >
            {staff.length === 0 ? (
              <Empty>No staff sales recorded in this window.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="[&>th]:border-b [&>th]:border-line [&>th]:px-3.5 [&>th]:pb-2.5 [&>th]:text-right [&>th]:font-mono [&>th]:text-[10px] [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-[0.06em] [&>th]:text-muted-foreground [&>th:first-child]:text-left">
                      <th>Staff</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                      <th>Profit</th>
                      <th>AOV</th>
                      <th>Refunds</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr>td]:border-b [&>tr>td]:border-line [&>tr:last-child>td]:border-b-0 [&>tr>td]:px-3.5 [&>tr>td]:py-3 [&>tr>td]:text-right [&>tr>td]:font-mono [&>tr>td]:text-[13px] [&>tr>td]:text-ink [&>tr>td:first-child]:text-left">
                    {staff.slice(0, 10).map((s) => (
                      <tr key={s.staff_id}>
                        <td className="!font-sans !font-semibold tracking-[-0.01em]">
                          {/* Deleted staff leave orders behind with no name. */}
                          {s.staff_name || "Unknown staff"}
                        </td>
                        <td>{n(s.total_orders).toLocaleString()}</td>
                        <td>{amt(s.total_revenue)}</td>
                        <td className="text-pos">{amt(s.total_profit)}</td>
                        <td>{amt(s.avg_order_value)}</td>
                        <td className={n(s.refund_count) === 0 ? "text-muted-2" : ""}>
                          {n(s.refund_count).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <SectionCard
            title="Health sub-scores"
            subtitle="scored for this location, on the same model as the business"
            action={
              <span className="font-mono text-[11px] text-muted-foreground">
                {healthScore ?? "—"} / 100
              </span>
            }
          >
            {healthScore == null && (
              <p className="mb-2.5 font-mono text-[11px] text-muted-2">
                Health is scored by a nightly model — no score computed for this
                location yet.
              </p>
            )}
            <HealthScoreBars health={health} />
            <DefList className="mt-2">
              <DefRow
                label="Activity"
                rawValue
                value={
                  <span
                    title={activity.hint}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold",
                      ACTIVITY_TONE[activity.tone],
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {activity.label}
                  </span>
                }
              />
              <DefRow
                label="Lifecycle stage"
                value={(lifecycle?.lifecycle_stage ?? "—").toLowerCase()}
                tone={lifecycle?.lifecycle_stage ? "default" : "dim"}
              />
              <DefRow
                label="Lifetime orders"
                value={n(lifecycle?.total_orders).toLocaleString()}
              />
              <DefRow
                label="Lifetime revenue"
                value={`${currency} ${amt(lifecycle?.total_revenue)}`}
              />
              <DefRow
                label="First order"
                value={rel(lifecycle?.first_order_at)}
                tone={lifecycle?.first_order_at ? "default" : "dim"}
              />
              <DefRow
                label="First paid order"
                value={
                  lifecycle?.first_paid_order_at
                    ? rel(lifecycle.first_paid_order_at)
                    : "None yet"
                }
                tone={lifecycle?.first_paid_order_at ? "default" : "dim"}
              />
            </DefList>
          </SectionCard>

          <SectionCard
            title="Subscription &amp; billing"
            subtitle="this location's own plan, not the business rollup"
          >
            {!item ? (
              <Empty>No subscription for this location.</Empty>
            ) : (
              <>
                <DefList>
                  <DefRow
                    label="Plan"
                    rawValue
                    value={
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[12.5px] text-ink">
                          {item.packageInfo?.name ?? "—"}
                        </span>
                        {item.packageInfo?.name && (
                          <PlanBadge
                            tier={planTier(item.packageInfo.name)}
                            label={item.packageInfo.name}
                          />
                        )}
                      </span>
                    }
                  />
                  <DefRow
                    label="Status"
                    rawValue
                    value={
                      <span className="flex items-center gap-2">
                        <SubscriptionItemStatusBadge status={item.status} />
                        {isTrialActive && (
                          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                            Trial active
                          </span>
                        )}
                      </span>
                    }
                  />
                  {canBilling && (
                    <DefRow label="MRR" value={`${currency} ${amt(mrr)}`} />
                  )}
                  {item.isBundled && (
                    <DefRow
                      label="Billing"
                      value="Bundled — covered by the parent location's plan"
                    />
                  )}
                  <DefRow label="Trial end" value={formatDate(item.trialEndDate)} />
                  {/* Kept as the real date even when exempt — it is the true record
                      of what was last paid for, and un-marking the account resumes
                      degradation from it. The suffix stops it reading as live. */}
                  <DefRow
                    label="Paid through"
                    value={`${formatDate(item.paidThrough)}${
                      subscription?.billingExempt ? " — not enforced (internal)" : ""
                    }`}
                  />
                  <DefRow label="Added" value={formatDate(item.addedAt)} />
                </DefList>
                {showBillingActions && subscription?.id && (
                  <LocationBillingActions
                    businessId={businessId}
                    subscriptionId={subscription.id}
                    item={item}
                    isSuperAdmin={isSuperAdmin}
                  />
                )}
              </>
            )}
          </SectionCard>

          {recommendations.length > 0 && (
            <SectionCard
              title="Recommendations"
              subtitle="generated by the nightly health model"
            >
              <ul className="space-y-1.5">
                {recommendations.map((rec) => (
                  <li
                    key={rec}
                    className="flex gap-2 text-[12.5px] leading-relaxed text-ink-2"
                  >
                    <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-muted-2" />
                    {rec}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard
            title={
              <CardTitle icon={<MapPin className="h-[16px] w-[16px]" />}>
                Where this sits
              </CardTitle>
            }
          >
            <DefList>
              <DefRow
                label="Business"
                rawValue
                value={
                  <Link
                    href={`/businesses/${businessId}`}
                    className="text-[12.5px] text-ink hover:text-[#C25E26]"
                  >
                    {businessName ?? "—"}
                  </Link>
                }
              />
              <DefRow label="Region" value={location.region ?? "—"} />
              <DefRow
                label="Coordinates"
                value={
                  location.latitude != null && location.longitude != null
                    ? `${location.latitude}, ${location.longitude}`
                    : "—"
                }
                tone={location.latitude != null ? "default" : "dim"}
              />
              <DefRow label="Opened" value={formatDate(location.createdAt)} />
            </DefList>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ── local presentational bits, mirroring the business detail's ───────────────

function CardTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
      <span className="text-primary">{icon}</span>
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-[13px] text-muted-foreground">{children}</p>;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 break-words text-[13px] text-ink",
          mono && "font-mono text-[12.5px]",
          empty && "text-muted-2",
        )}
      >
        {empty ? "—" : value}
      </div>
    </div>
  );
}

function KCell({
  icon,
  label,
  value,
  valueColor,
  currency,
  sub,
  subTone = "muted",
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  currency?: string;
  sub?: React.ReactNode;
  subTone?: "muted" | "pos" | "warn";
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className="mt-1.5 truncate text-[19px] font-semibold tracking-[-0.02em] text-ink"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {currency && (
          <span className="mr-1 font-mono text-[11px] font-medium text-muted-2">
            {currency}
          </span>
        )}
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            "mt-0.5 truncate font-mono text-[11px]",
            subTone === "pos"
              ? "text-pos"
              : subTone === "warn"
                ? "text-warn"
                : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
