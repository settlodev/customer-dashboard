"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Bell,
  BellOff,
  CalendarDays,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Star,
  StickyNote,
  Tag,
  User,
  Wallet,
} from "lucide-react";

import {
  EmptyState,
  FactGrid,
  fact,
  HeroCard,
  HeroChip,
  HeroLabel,
  HeroMeter,
  HeroValue,
  HERO_TONE_HEX,
  PanelCard,
  RailCard,
  SegTabs,
  StatusPill,
  VList,
  VRow,
  type Fact,
  type HeroTone,
  type SegTab,
  type Tone,
} from "@/components/layouts/order-detail";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { Badge } from "@/components/ui/badge";
import { CustomerArInvoicesPanel } from "@/components/customer/customer-ar-invoices-panel";
import { CustomerInsightsPanel } from "@/components/customer/customer-insights-panel";
import { CustomerOrdersPanel } from "@/components/customer/customer-orders-panel";
import { CustomerPrepaidAccountTab } from "@/components/customer/customer-prepaid-account-tab";
import type { OrdersKpis } from "@/components/orders/orders-panel";
import { DebtorCellAction } from "@/components/tables/debtor/cell-action";
import { usePermissions } from "@/context/permissionsContext";
import { formatDate } from "@/lib/format-datetime";
import type { CustomerTab } from "@/lib/customers/customer-detail-tabs";
import type { CustomerOrderBucket } from "@/lib/orders/customer-order-buckets";
import {
  AGING_BUCKET_LABELS,
  type AgingBucket,
  type CustomerArBalance,
} from "@/types/customer-ar/type";
import type {
  CustomerArInvoiceSummary,
  CustomerSignedBill,
} from "@/types/customer-ar-invoice/type";
import {
  ADDRESS_TYPE_LABELS,
  CUSTOMER_CREATED_FROM_LABELS,
  CUSTOMER_SEGMENT_LABELS,
  CUSTOMER_SOURCE_LABELS,
  type Customer,
  type CustomerBehaviour,
  type CustomerInsights,
  type CustomerPreference,
  type CustomerPurchaseSummary,
  type CustomerRank,
  type CustomerSegment,
} from "@/types/customer/type";
import type { Order } from "@/types/orders/type";

// Same shape as the sales-order detail page: a persistent money rail on the
// left — what the customer owes, who they are, where they stand — and the
// record's detail behind segmented drill-down tabs on the right. The order
// ledger leads, because "what has this customer got open with us" is the
// question the page is opened to answer.

interface Props {
  customer: Customer;
  preferences: CustomerPreference[];
  arBalance: CustomerArBalance | null;
  /** The customer's unsettled signed bills — the invoiceable set. */
  signedBills: CustomerSignedBill[];
  /** Consolidated invoices already raised over those bills. */
  arInvoices: CustomerArInvoiceSummary[];
  /** Reports roll-up: order count, lifetime value, first/last order. */
  purchase: CustomerPurchaseSummary | null;
  /** OMS all-time ledger totals with the bucket split; null when unavailable. */
  ledger: OrdersKpis | null;
  /**
   * Reports Service insights at this location — behaviour, rank, monthly
   * spend, favourites. Null when the service could not be reached.
   */
  insights: CustomerInsights | null;
  orders: {
    rows: Order[];
    pageCount: number;
    pageNo: number;
    total: number;
    bucket: CustomerOrderBucket;
    searching: boolean;
  };
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
  currency: string;
  /** Active tab from `?tab=`; the URL keeps it across list paging. */
  tab: CustomerTab;
  preservedParams: Record<string, string | undefined>;
}

// ─── formatting ──────────────────────────────────────────────────────

const fmt = (value: number | null | undefined) =>
  value == null
    ? "—"
    : Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

const AGING_HERO_TONE: Record<AgingBucket, HeroTone> = {
  CURRENT: "warn",
  DAYS_30: "warn",
  DAYS_60: "neg",
  DAYS_90: "neg",
  DAYS_90_PLUS: "neg",
};

const AGING_PILL_TONE: Record<AgingBucket, Tone> = {
  CURRENT: "warn",
  DAYS_30: "warn",
  DAYS_60: "neg",
  DAYS_90: "neg",
  DAYS_90_PLUS: "neg",
};

const dim = (label: string) => (
  <span className="font-medium text-muted-2">{label}</span>
);

/** "Top 5%" for the location's biggest spenders, "Top half" further down. */
const rankBand = (rank: CustomerRank) => {
  const pct = (rank.position / rank.customerCount) * 100;
  if (pct <= 5) return "top 5%";
  if (pct <= 10) return "top 10%";
  if (pct <= 25) return "top quarter";
  if (pct <= 50) return "top half";
  return "bottom half";
};

const SEGMENT_TONE: Record<CustomerSegment, Tone> = {
  CHAMPION: "pos",
  LOYAL: "pos",
  BIG_SPENDER: "pos",
  NEW: "info",
  REGULAR: "info",
  AT_RISK: "warn",
  CANT_LOSE: "warn",
  LOST: "neg",
};

const segmentLabel = (s: string | null | undefined) =>
  s
    ? (CUSTOMER_SEGMENT_LABELS[s as CustomerSegment] ??
      s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))
    : null;

/** A 30-day trend as a signed percentage string, or null when flat / unknown. */
const trendText = (v: number) => {
  if (!Number.isFinite(v) || Math.abs(v) < 0.005) return null;
  const pct = Math.round(Math.abs(v) * 100);
  return `${v > 0 ? "▲" : "▼"} ${pct}%`;
};

const roundDays = (d: number) =>
  d >= 10 ? Math.round(d).toString() : (Math.round(d * 10) / 10).toString();

// ─── view ────────────────────────────────────────────────────────────

export function CustomerDetailView({
  customer,
  preferences,
  arBalance,
  signedBills,
  arInvoices,
  purchase,
  ledger,
  insights,
  orders,
  tableMode,
  staffNames,
  tableNames,
  currency,
  tab: initialTab,
  preservedParams,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // Local state switches the panel instantly; the URL is updated in place
  // (no navigation, no server round-trip) so the tab survives the table's
  // own `?page` / `?search` replaces and a reload lands on the same tab.
  const [tab, setTab] = useState<CustomerTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);
  const selectTab = (next: CustomerTab) => {
    setTab(next);
    const qs = new URLSearchParams(searchParams?.toString());
    if (next === "orders") qs.delete("tab");
    else qs.set("tab", next);
    const query = qs.toString();
    window.history.replaceState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  };

  const canSeePrepaid = hasPermission("customer_prepayments:view");
  const outstanding = arBalance?.outstandingBalance ?? 0;

  const tabs: SegTab<CustomerTab>[] = [
    {
      id: "orders",
      label: "Orders",
      icon: ReceiptText,
      count: ledger?.totalOrders || undefined,
    },
    { id: "insights", label: "Insights", icon: Sparkles },
    {
      id: "balance",
      label: "Outstanding",
      icon: Receipt,
      count: outstanding > 0 ? arBalance?.outstandingOrderCount : undefined,
    },
    ...(canSeePrepaid
      ? [{ id: "prepaid" as const, label: "Prepaid account", icon: Wallet }]
      : []),
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SpendStrip
        customer={customer}
        purchase={purchase}
        ledger={ledger}
        rank={insights?.rank ?? null}
        currency={currency}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
          <DebtHero
            customer={customer}
            arBalance={arBalance}
            currency={currency}
          />
          <RailCard icon={<Activity className="h-3.5 w-3.5" />} title="Behaviour">
            <BehaviourList
              behaviour={insights?.behaviour ?? null}
              reachable={insights != null}
              currency={currency}
            />
          </RailCard>
          <RailCard icon={<Phone className="h-3.5 w-3.5" />} title="Contact">
            <ContactList customer={customer} />
          </RailCard>
          <RailCard icon={<Star className="h-3.5 w-3.5" />} title="Standing">
            <StandingList customer={customer} currency={currency} />
          </RailCard>
        </aside>

        <main className="flex min-w-0 flex-col gap-3.5">
          <SegTabs tabs={tabs} active={tab} onSelect={selectTab} />
          <div>
            {tab === "orders" && (
              <CustomerOrdersPanel
                basePath={`/customers/${customer.id}`}
                rows={orders.rows}
                pageCount={orders.pageCount}
                pageNo={orders.pageNo}
                total={orders.total}
                bucket={orders.bucket}
                searching={orders.searching}
                ledger={ledger}
                tableMode={tableMode}
                staffNames={staffNames}
                tableNames={tableNames}
                currency={currency}
                preservedParams={preservedParams}
              />
            )}
            {tab === "insights" && (
              <CustomerInsightsPanel insights={insights} currency={currency} />
            )}
            {tab === "balance" && (
              <OutstandingPanel
                customer={customer}
                arBalance={arBalance}
                signedBills={signedBills}
                arInvoices={arInvoices}
                currency={arBalance?.currency ?? currency}
              />
            )}
            {tab === "prepaid" && canSeePrepaid && (
              <CustomerPrepaidAccountTab
                customerId={customer.id}
                locationId={customer.locationId}
              />
            )}
            {tab === "profile" && (
              <ProfilePanel customer={customer} preferences={preferences} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── KPI strip ───────────────────────────────────────────────────────

function SpendStrip({
  customer,
  purchase,
  ledger,
  rank,
  currency,
}: {
  customer: Customer;
  purchase: CustomerPurchaseSummary | null;
  ledger: OrdersKpis | null;
  rank: CustomerRank | null;
  currency: string;
}) {
  const orderCount = ledger?.totalOrders ?? purchase?.orderCount ?? 0;
  const ongoing = ledger?.ongoingOrders ?? 0;
  const signed = ledger?.signedOrders ?? 0;
  const ledgerDelta =
    ongoing > 0 || signed > 0
      ? [
          ongoing > 0 ? `${ongoing.toLocaleString()} ongoing` : null,
          signed > 0 ? `${signed.toLocaleString()} signed` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : orderCount > 0
        ? "All settled"
        : undefined;
  const lastOrder = formatDate(purchase?.lastOrderDate);
  const firstOrder = formatDate(purchase?.firstOrderDate);

  return (
    <KpiStrip cols={5}>
      <KpiCard
        icon={<CircleDollarSign className="h-3 w-3" />}
        label="Lifetime spend"
        value={purchase && purchase.lifetimeValue > 0 ? fmt(purchase.lifetimeValue) : "—"}
        unit={purchase && purchase.lifetimeValue > 0 ? currency : undefined}
        delta={
          rank && rank.customerCount > 0
            ? `#${rank.position.toLocaleString()} of ${rank.customerCount.toLocaleString()} here · ${rankBand(rank)}`
            : purchase && purchase.orderCount > 0
              ? `Across ${plural(purchase.orderCount, "order")}`
              : "No revenue yet"
        }
        deltaTone={rank && rank.position <= Math.max(1, rank.customerCount * 0.1) ? "pos" : "neutral"}
      />
      <KpiCard
        icon={<ReceiptText className="h-3 w-3" />}
        label="Orders"
        value={orderCount > 0 ? orderCount.toLocaleString() : "—"}
        delta={ledgerDelta}
        deltaTone={signed > 0 ? "neg" : "neutral"}
      />
      <KpiCard
        icon={<ShoppingBag className="h-3 w-3" />}
        label="Average order"
        value={
          purchase && purchase.averageOrderValue > 0
            ? fmt(purchase.averageOrderValue)
            : "—"
        }
        unit={purchase && purchase.averageOrderValue > 0 ? currency : undefined}
        deltaTone="neutral"
      />
      <KpiCard
        icon={<CalendarDays className="h-3 w-3" />}
        label="Last order"
        value={lastOrder || "—"}
        delta={firstOrder ? `First ${firstOrder}` : undefined}
        deltaTone="neutral"
      />
      <KpiCard
        icon={<Star className="h-3 w-3" />}
        label="Loyalty"
        value={customer.loyaltyPoints.toLocaleString()}
        unit="pts"
        delta={
          customer.loyaltyPointsCarryOver > 0
            ? `+${customer.loyaltyPointsCarryOver.toLocaleString()} carried over`
            : undefined
        }
        deltaTone={customer.loyaltyPoints > 0 ? "pos" : "neutral"}
      />
    </KpiStrip>
  );
}

// ─── money rail ──────────────────────────────────────────────────────

function DebtHero({
  customer,
  arBalance,
  currency,
}: {
  customer: Customer;
  arBalance: CustomerArBalance | null;
  currency: string;
}) {
  const owed = arBalance?.outstandingBalance ?? 0;
  const cur = arBalance?.currency ?? currency;
  const hasDebt = owed > 0;
  const limit = customer.creditLimit ?? 0;
  const tone: HeroTone =
    hasDebt && arBalance ? AGING_HERO_TONE[arBalance.agingBucket] : "pos";
  const usedPct = limit > 0 ? Math.min(100, (owed / limit) * 100) : 0;
  const oldest = formatDate(arBalance?.oldestUnsettledAt);

  return (
    <HeroCard>
      <div className="flex items-center justify-between gap-3">
        <HeroLabel>Outstanding balance</HeroLabel>
        <HeroChip tone={tone}>
          {hasDebt && arBalance
            ? AGING_BUCKET_LABELS[arBalance.agingBucket]
            : "Nothing owed"}
        </HeroChip>
      </div>
      <HeroValue value={fmt(owed)} unit={cur} />
      {limit > 0 ? (
        <HeroMeter
          pct={usedPct}
          color={HERO_TONE_HEX[hasDebt ? tone : "pos"]}
          left={`${Math.round(usedPct)}% of credit limit`}
          right={`${fmt(Math.max(limit - owed, 0))} ${cur} available`}
        />
      ) : null}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-white/70">
        {hasDebt && arBalance ? (
          <>
            <span>
              <span className="font-semibold text-white">
                {plural(arBalance.outstandingOrderCount, "signed bill")}
              </span>
            </span>
            <span>
              <span className="font-semibold text-white">
                {plural(arBalance.daysOutstanding, "day")}
              </span>{" "}
              outstanding
            </span>
            {oldest ? <span>Oldest {oldest}</span> : null}
          </>
        ) : (
          <span>
            {limit > 0
              ? "No signed bills on the account"
              : "No credit limit set · no signed bills on the account"}
          </span>
        )}
      </div>
    </HeroCard>
  );
}

function BehaviourList({
  behaviour,
  reachable,
  currency,
}: {
  behaviour: CustomerBehaviour | null;
  reachable: boolean;
  currency: string;
}) {
  if (!behaviour) {
    return (
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        {reachable
          ? "Not scored yet. The nightly analytics run scores a customer once they have bought at this location."
          : "Behaviour unavailable — the analytics service could not be reached."}
      </p>
    );
  }

  const seg = behaviour.segment ?? "";
  const tone: Tone = SEGMENT_TONE[seg as CustomerSegment] ?? "muted";
  const cadence = behaviour.avgDaysBetweenOrders;
  const nextIn = behaviour.predictedNextOrderDays;
  const since = behaviour.daysSinceLastOrder;
  const overdue = nextIn > 0 && since > nextIn;
  const spend = trendText(behaviour.spendTrend30d);
  const visits = trendText(behaviour.frequencyTrend30d);

  // Channel mix: the two biggest shares that are actually non-zero.
  const channels = [
    { label: "Dine-in", v: behaviour.pctDineIn },
    { label: "Takeaway", v: behaviour.pctTakeaway },
    { label: "Delivery", v: behaviour.pctDelivery },
  ]
    .filter((c) => c.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((c) => `${c.label} ${Math.round(c.v)}%`)
    .join(" · ");

  return (
    <>
      <VList>
        <VRow
          label="Segment"
          value={
            <span className="inline-flex items-center gap-1.5">
              <StatusPill tone={tone} dot>
                {segmentLabel(seg) ?? "Unscored"}
              </StatusPill>
              {behaviour.atRisk && seg !== "AT_RISK" ? (
                <StatusPill tone="warn">At risk</StatusPill>
              ) : null}
            </span>
          }
        />
        <VRow
          label="Visits"
          value={
            cadence > 0
              ? `Every ~${roundDays(cadence)} days`
              : behaviour.lifetimeOrders > 0
                ? dim("One visit so far")
                : dim("—")
          }
        />
        <VRow
          label="Last seen"
          value={
            since === 0
              ? "Today"
              : `${since.toLocaleString()} ${since === 1 ? "day" : "days"} ago`
          }
        />
        <VRow
          label="Next expected"
          value={
            nextIn > 0 ? (
              overdue ? (
                <span className="text-warn">
                  Overdue by {roundDays(since - nextIn)} days
                </span>
              ) : (
                `In ~${roundDays(Math.max(nextIn - since, 0))} days`
              )
            ) : (
              dim("—")
            )
          }
        />
        <VRow
          label="30-day spend"
          value={
            spend ? (
              <span className={behaviour.spendTrend30d > 0 ? "text-pos" : "text-neg"}>
                {spend}
              </span>
            ) : (
              dim("Flat")
            )
          }
        />
        <VRow
          label="30-day visits"
          value={
            visits ? (
              <span className={behaviour.frequencyTrend30d > 0 ? "text-pos" : "text-neg"}>
                {visits}
              </span>
            ) : (
              dim("Flat")
            )
          }
        />
        <VRow
          label="Basket"
          value={
            behaviour.avgBasketValue > 0 ? (
              <span className="tabular-nums">
                {behaviour.avgBasketSize > 0
                  ? `${roundDays(behaviour.avgBasketSize)} items · `
                  : ""}
                {fmt(behaviour.avgBasketValue)}{" "}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {currency}
                </span>
              </span>
            ) : (
              dim("—")
            )
          }
        />
        <VRow
          label="Discounts"
          value={
            behaviour.ordersWithDiscountPct > 0
              ? `${Math.round(behaviour.ordersWithDiscountPct)}% of orders`
              : dim("None")
          }
        />
        {channels ? <VRow label="Channel" value={channels} /> : null}
      </VList>
      <p className="mt-3 font-mono text-[10.5px] text-muted-foreground">
        As of {formatDate(behaviour.asOf) || "—"} · at this location
      </p>
    </>
  );
}

function ContactList({ customer }: { customer: Customer }) {
  const v = (value?: string | null) => (value?.trim() ? value : dim("—"));
  return (
    <VList>
      <VRow label="Phone" value={v(customer.phoneNumber)} />
      <VRow label="Email" value={v(customer.email)} />
      <VRow label="Region" value={v(customer.region)} />
      <VRow label="Group" value={v(customer.customerGroupName)} />
      <VRow
        label="Account no."
        value={
          customer.customerAccountNumber ? (
            <span className="font-mono text-[11.5px] tracking-[0.02em]">
              {customer.customerAccountNumber}
            </span>
          ) : (
            dim("—")
          )
        }
      />
      <VRow
        label="Member since"
        value={formatDate(customer.createdAt) || dim("—")}
      />
    </VList>
  );
}

function StandingList({
  customer,
  currency,
}: {
  customer: Customer;
  currency: string;
}) {
  return (
    <VList>
      <VRow
        label="Status"
        value={
          <Badge variant={customer.active ? "pos" : "soft"}>
            {customer.active ? "Active" : "Inactive"}
          </Badge>
        }
      />
      <VRow
        label="Credit limit"
        value={
          customer.creditLimit != null ? (
            <span className="tabular-nums">
              {fmt(customer.creditLimit)}{" "}
              <span className="font-mono text-[11px] text-muted-foreground">
                {currency}
              </span>
            </span>
          ) : (
            dim("Not set")
          )
        }
      />
      <VRow
        label="Loyalty"
        value={
          <span className="tabular-nums">
            {customer.loyaltyPoints.toLocaleString()}{" "}
            <span className="font-mono text-[11px] text-muted-foreground">
              pts
            </span>
          </span>
        }
      />
      <VRow
        label="Notifications"
        value={
          <span className="inline-flex items-center gap-1.5">
            {customer.allowNotifications ? (
              <Bell className="h-3 w-3 text-pos" />
            ) : (
              <BellOff className="h-3 w-3 text-muted-foreground" />
            )}
            {customer.allowNotifications ? "On" : "Off"}
          </span>
        }
      />
      <VRow
        label="Source"
        value={
          customer.source
            ? (CUSTOMER_SOURCE_LABELS[customer.source] ?? customer.source)
            : dim("—")
        }
      />
      <VRow
        label="No-shows"
        value={
          customer.noShowCount > 0 ? (
            <span className="tabular-nums text-warn">
              {customer.noShowCount.toLocaleString()}
            </span>
          ) : (
            dim("None")
          )
        }
      />
    </VList>
  );
}

// ─── Outstanding balance ─────────────────────────────────────────────

function OutstandingPanel({
  customer,
  arBalance,
  signedBills,
  arInvoices,
  currency,
}: {
  customer: Customer;
  arBalance: CustomerArBalance | null;
  signedBills: CustomerSignedBill[];
  arInvoices: CustomerArInvoiceSummary[];
  currency: string;
}) {
  const owed = arBalance?.outstandingBalance ?? 0;
  const hasDebt = !!arBalance && owed > 0;

  const money = (n: number | null | undefined) =>
    n != null ? (
      <span className="tabular-nums">
        {fmt(n)}{" "}
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          {currency}
        </span>
      </span>
    ) : null;

  const facts: Fact[] = arBalance
    ? [
        {
          label: "Outstanding",
          icon: <Receipt className="h-3 w-3" />,
          badge: (
            <StatusPill tone={hasDebt ? "neg" : "pos"} dot>
              {hasDebt ? `${fmt(owed)} ${currency}` : "Nothing owed"}
            </StatusPill>
          ),
        },
        {
          label: "Aging",
          icon: <Clock className="h-3 w-3" />,
          badge: hasDebt ? (
            <StatusPill tone={AGING_PILL_TONE[arBalance.agingBucket]}>
              {AGING_BUCKET_LABELS[arBalance.agingBucket]}
            </StatusPill>
          ) : (
            <span className="text-[13px] font-medium text-muted-2">—</span>
          ),
        },
        fact(
          "Signed bills",
          hasDebt ? arBalance.outstandingOrderCount.toLocaleString() : null,
          <FileText className="h-3 w-3" />,
        ),
        fact(
          "Days outstanding",
          hasDebt ? arBalance.daysOutstanding.toLocaleString() : null,
          <CalendarDays className="h-3 w-3" />,
        ),
        fact("Total charged", money(arBalance.totalCharged)),
        fact("Total settled", money(arBalance.totalSettled)),
        fact("Oldest unsettled", formatDate(arBalance.oldestUnsettledAt)),
        fact("Last charge", formatDate(arBalance.lastChargeAt)),
        fact("Last settlement", formatDate(arBalance.lastSettlementAt)),
        fact(
          "Credit limit",
          customer.creditLimit != null ? money(customer.creditLimit) : null,
          <CreditCard className="h-3 w-3" />,
        ),
      ]
    : [];

  return (
    <div className="flex flex-col gap-3.5">
      <PanelCard
        icon={<Receipt className="h-3.5 w-3.5" />}
        title="Outstanding balance"
        actions={hasDebt ? <DebtorCellAction data={arBalance} /> : undefined}
      >
        {arBalance ? (
          <FactGrid rows={facts} cols={2} />
        ) : (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="Nothing owed"
            sub="Signed bills and unsettled charges for this customer will show up here."
          />
        )}
      </PanelCard>

      <CustomerArInvoicesPanel
        customerId={customer.id}
        currency={currency}
        signedBills={signedBills}
        invoices={arInvoices}
      />
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────

function ProfilePanel({
  customer,
  preferences,
}: {
  customer: Customer;
  preferences: CustomerPreference[];
}) {
  const fullName =
    customer.fullName?.trim() ||
    `${customer.firstName} ${customer.lastName}`.trim();
  const addresses = customer.addresses ?? [];

  const profile: Fact[] = [
    fact("Full name", fullName, <User className="h-3 w-3" />),
    fact("Gender", customer.gender),
    fact(
      "Date of birth",
      formatDate(customer.dateOfBirth),
      <CalendarDays className="h-3 w-3" />,
    ),
    fact("Phone", customer.phoneNumber, <Phone className="h-3 w-3" />),
    fact("Email", customer.email, <Mail className="h-3 w-3" />),
    fact("Region", customer.region, <MapPin className="h-3 w-3" />),
    fact(
      "Source",
      customer.source
        ? (CUSTOMER_SOURCE_LABELS[customer.source] ?? customer.source)
        : null,
    ),
    fact(
      "Created from",
      customer.createdFrom
        ? (CUSTOMER_CREATED_FROM_LABELS[customer.createdFrom] ??
          customer.createdFrom)
        : null,
    ),
    fact("Identifier", customer.identifier, <IdCard className="h-3 w-3" />, {
      mono: true,
    }),
    fact(
      "Member since",
      formatDate(customer.createdAt),
      <Clock className="h-3 w-3" />,
    ),
  ];

  const identification: Fact[] = [
    fact("ID type", customer.idType),
    fact("ID number", customer.idNumber, undefined, { mono: true }),
    fact("TIN", customer.tinNumber, undefined, { mono: true }),
    fact("VRN", customer.vrn, undefined, { mono: true }),
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <PanelCard icon={<User className="h-3.5 w-3.5" />} title="Profile">
        <FactGrid rows={profile} cols={2} />
      </PanelCard>

      <PanelCard
        icon={<FileText className="h-3.5 w-3.5" />}
        title="Identification"
      >
        <FactGrid rows={identification} cols={2} />
      </PanelCard>

      <PanelCard
        icon={<MapPin className="h-3.5 w-3.5" />}
        title="Addresses"
        count={addresses.length || undefined}
        pad0={addresses.length === 0}
      >
        {addresses.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-5 w-5" />}
            title="No addresses on file"
            sub="Capture one when you next take an order or reservation."
          />
        ) : (
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {addresses.map((addr) => (
              <div
                key={addr.id as string}
                className="flex flex-col gap-1.5 bg-card px-4 py-3"
              >
                <Badge variant="soft" className="w-fit text-[10.5px]">
                  {ADDRESS_TYPE_LABELS[addr.addressType] ?? addr.addressType}
                </Badge>
                <p className="whitespace-pre-wrap text-[13px] text-ink-2">
                  {addr.addressLine}
                </p>
              </div>
            ))}
          </div>
        )}
      </PanelCard>

      <PanelCard
        icon={<Tag className="h-3.5 w-3.5" />}
        title="Preferences"
        count={preferences.length || undefined}
        pad0={preferences.length === 0}
      >
        {preferences.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-5 w-5" />}
            title="No preferences captured"
            sub="Staff can record dietary, seating, or communication preferences over time."
          />
        ) : (
          <FactGrid
            rows={preferences.map((p) =>
              fact(p.preferenceKey, p.preferenceValue),
            )}
            cols={2}
          />
        )}
      </PanelCard>

      {customer.notes ? (
        <PanelCard
          icon={<StickyNote className="h-3.5 w-3.5" />}
          title="Staff notes"
        >
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
            {customer.notes}
          </p>
        </PanelCard>
      ) : null}
    </div>
  );
}
