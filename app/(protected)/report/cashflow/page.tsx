import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { requireReportsReadAll } from "@/lib/auth-utils";

import { SectionCard } from "@/components/admin/shared/section-card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { CashflowExportButton } from "@/components/reports/cashflow/cashflow-export-button";
import {
  CashflowMethodBreakdown,
  CashflowSummaryPanel,
} from "@/components/reports/cashflow/cashflow-panels";
import { CashflowTrendChart } from "@/components/reports/cashflow/cashflow-trend-chart";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { fetchOverview } from "@/lib/actions/dashboard-action";
import { cashFlowDaily } from "@/lib/actions/order-actions";
import { getPaymentMethodBreakdown } from "@/lib/actions/transaction-analytics-actions";
import {
  buildPlaceholderTrend,
  buildTrendFromDaily,
} from "@/lib/reports/cashflow-trend";
import { breakdownToMethodRows, fmtAmount } from "@/types/reports/cashflow";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type OverviewResponse from "@/types/dashboard/type";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

const pluralize = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

export default async function CashflowReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  // Default to the current month — keeps the first paint scoped, matching
  // every other reporting screen.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  // `cashFlowReport` takes Date objects; widen to whole days so the last
  // day's evening trade is included (same convention as the sales report).
  const [overview, currency, paymentBreakdown, dailyPoints] =
    await Promise.all([
      // KPIs/summary come from the Reports Service overview. (The old
      // /api/reports cash-flow summary was never migrated and 404s behind
      // the analytics gateway.)
      fetchOverview(from, to)
        .then((data) => data as OverviewResponse | null)
        .catch((e) => {
          rethrowIfBoundary(e);
          return null;
        }),
      getLocationCurrency().catch(() => "TZS"),
      // Richer per-tender breakdown (transaction counts + server-computed
      // share). The overview reads the same transactions, so they reconcile.
      getPaymentMethodBreakdown({ startDate: from, endDate: to }).catch(
        (e) => {
          rethrowIfBoundary(e);
          return [];
        },
      ),
      // Real per-day series for the trend chart. [] → fall back to a modeled
      // trend (e.g. before the endpoint is deployed).
      cashFlowDaily(from, to).catch((e) => {
        rethrowIfBoundary(e);
        return [];
      }),
    ]);

  const cashIn = overview?.transactionsAmount ?? 0;
  const expenses = overview?.expensesPaidAmount ?? 0;
  const refunds = overview?.totalRefundedAmount ?? 0;
  const cashOut = expenses + refunds;
  const closing = overview?.closingBalance ?? cashIn - cashOut;

  const methodRows = breakdownToMethodRows(paymentBreakdown);

  // The overview carries no settled-transaction count, so sum the per-tender
  // counts from the payment-method breakdown.
  const txnCount = methodRows.reduce((sum, row) => sum + (row.count ?? 0), 0);
  const expenseCount = overview?.totalExpenses ?? 0;
  const refundCount = overview?.totalRefundCount ?? 0;
  const outCount = expenseCount + refundCount;
  // Real daily series when the endpoint returns data; otherwise a modeled
  // distribution of the period totals (flagged "Live data pending").
  const hasDailySeries = dailyPoints.length > 0;
  const trend = hasDailySeries
    ? buildTrendFromDaily(from, to, dailyPoints)
    : buildPlaceholderTrend(from, to, cashIn, cashOut);
  const trendIsStub = !hasDailySeries;
  const hasMovement = cashIn !== 0 || cashOut !== 0;
  const retainRate = cashIn > 0 ? (closing / cashIn) * 100 : null;

  const subtitle =
    from === to
      ? `Cash position on ${format(new Date(from), "MMM d, yyyy")}`
      : `Cash position ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const money = (value: number) => (hasMovement ? fmtAmount(value) : "—");
  const signedClosing = hasMovement
    ? `${closing < 0 ? "−" : ""}${fmtAmount(Math.abs(closing))}`
    : "—";

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Cashflow" }]} />
      <PageHeader
        title="Cashflow report"
        subtitle={subtitle}
        titleAccessory={
          <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {currency}
          </span>
        }
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OrdersDateFilter from={from} to={to} />
          <CashflowExportButton
            from={from}
            to={to}
            currency={currency}
            cashIn={cashIn}
            txnCount={txnCount}
            cashOut={cashOut}
            outCount={outCount}
            expenses={expenses}
            expenseCount={expenseCount}
            refunds={refunds}
            refundCount={refundCount}
            closing={closing}
            methodRows={methodRows}
            disabled={!hasMovement}
          />
        </div>

        <KpiStrip cols={5}>
          <KpiCard
            icon={<ArrowDownToLine className="h-3 w-3" />}
            label="Cash in"
            value={money(cashIn)}
            unit={currency}
            delta={pluralize(txnCount, "transaction")}
            deltaTone="pos"
          />
          <KpiCard
            icon={<ArrowUpFromLine className="h-3 w-3" />}
            label="Cash out"
            value={money(cashOut)}
            unit={currency}
            delta={pluralize(outCount, "payment")}
            deltaTone="neg"
          />
          <KpiCard
            icon={<Wallet className="h-3 w-3" />}
            label="Closing balance"
            value={signedClosing}
            unit={currency}
            delta={
              retainRate !== null
                ? `${retainRate.toFixed(1)}% of cash in`
                : undefined
            }
            deltaTone={closing < 0 ? "neg" : "pos"}
          />
          <KpiCard
            icon={<Receipt className="h-3 w-3" />}
            label="Expenses"
            value={money(expenses)}
            unit={currency}
            delta={pluralize(expenseCount, "payment")}
            deltaTone="neutral"
          />
          <KpiCard
            icon={<RefreshCcw className="h-3 w-3" />}
            label="Refunds"
            value={money(refunds)}
            unit={currency}
            delta={pluralize(refundCount, "refund")}
            deltaTone={refunds > 0 ? "neg" : "neutral"}
          />
        </KpiStrip>

        {hasMovement ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Cash flow over time"
                subtitle={
                  trendIsStub
                    ? "Daily money in vs out — modeled from period totals"
                    : "Daily money in vs out across the period"
                }
                stub={trendIsStub}
              >
                <CashflowTrendChart data={trend} currency={currency} />
              </SectionCard>

              <SectionCard
                title="Cash flow summary"
                subtitle="How inflow nets down to the closing balance"
              >
                <CashflowSummaryPanel
                  cashIn={cashIn}
                  expenses={expenses}
                  refunds={refunds}
                  closing={closing}
                  currency={currency}
                />
              </SectionCard>
            </div>

            <SectionCard
              title="Cash in by payment method"
              subtitle={`How customers paid · ${pluralize(methodRows.length, "method")}`}
            >
              <CashflowMethodBreakdown rows={methodRows} currency={currency} />
            </SectionCard>
          </>
        ) : (
          <NoItems itemName="cash flow" />
        )}
      </PageBody>
    </PageShell>
  );
}
