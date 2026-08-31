import { endOfMonth, format, startOfMonth } from "date-fns";
import { CircleDollarSign, Receipt, Scale, ShieldCheck } from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { VfdStatusNotice } from "@/components/reports/z-report/vfd-status-notice";
import { ZReportTable } from "@/components/reports/z-report/z-report-table";
import { getCurrentDestination } from "@/lib/actions/context";
import { getZReportRange } from "@/lib/actions/z-report-actions";
import { requireReportAccess } from "@/lib/auth-utils";

type Params = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

const fmtMoney = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * Combined daily Z-report — one row per date, the local close-of-day roll-up
 * beside the TRA fiscal (VFD) Z for the same date.
 *
 * <p>Anchored on the DATE, not the day session: the Reports Service Z-report
 * is bucketed per session (a date can hold several after a reopen) while the
 * device issues exactly one Z per fiscal day, so a session-anchored page can
 * never line the two up.
 */
export default async function ZReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportAccess("/report/z-report");

  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const destination = await getCurrentDestination();
  // Fiscal devices and day sessions are both location-scoped; a
  // store/warehouse destination has neither.
  if (!destination || destination.type !== "LOCATION") {
    return (
      <PageShell maxWidth="wide">
        <PageBreadcrumbs items={[{ title: "Z-report" }]} />
        <PageHeader
          title="Z-report"
          subtitle="Pick a location to compare its daily close against TRA."
        />
        <PageBody>
          <NoItems itemName="Z-reports" />
        </PageBody>
      </PageShell>
    );
  }

  const report = await getZReportRange(destination.id, from, to);
  const showVfd = report.vfd === "available";
  const { totals } = report;

  const salesGap =
    totals.vfdSales === null ? null : totals.net - totals.vfdSales;
  const receiptGap =
    totals.vfdReceipts === null ? null : totals.orderCount - totals.vfdReceipts;

  const subtitle =
    from === to
      ? `Close of ${format(new Date(from), "MMM d, yyyy")}`
      : `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Z-report" }]} />
      <PageHeader
        title="Z-report"
        subtitle={`${subtitle} · every session of a day rolled up, set against the TRA fiscal Z`}
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {totals.days} {totals.days === 1 ? "day" : "days"} ·{" "}
            {totals.sessionCount}{" "}
            {totals.sessionCount === 1 ? "session" : "sessions"}
          </span>
          <OrdersDateFilter from={from} to={to} />
        </div>

        <KpiStrip cols={4}>
          <KpiCard
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
            label="Net sales (Settlo)"
            value={fmtMoney(totals.net)}
            unit={report.currency}
            delta={`${totals.orderCount.toLocaleString()} orders`}
            tooltip="Selling value billed across every session in the range, comps included."
          />
          <KpiCard
            icon={<Receipt className="h-3.5 w-3.5" />}
            label="Tax (Settlo)"
            value={fmtMoney(totals.taxAmount)}
            unit={report.currency}
            delta="as charged on orders"
            tooltip="From the tax report — the session Z-report carries no tax of its own."
          />
          <KpiCard
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Sales (VFD)"
            value={showVfd ? fmtMoney(totals.vfdSales) : "—"}
            unit={showVfd ? report.currency : undefined}
            delta={
              showVfd
                ? `${(totals.vfdReceipts ?? 0).toLocaleString()} fiscal receipts`
                : "no fiscal device"
            }
            tooltip="VAT-inclusive sales the fiscal device reported to TRA for the range."
          />
          <KpiCard
            icon={<Scale className="h-3.5 w-3.5" />}
            label="Difference"
            value={
              salesGap === null
                ? "—"
                : `${salesGap > 0 ? "+" : ""}${fmtMoney(salesGap)}`
            }
            unit={salesGap === null ? undefined : report.currency}
            delta={
              receiptGap === null
                ? "needs a fiscal device"
                : `${receiptGap > 0 ? "+" : ""}${receiptGap} vs receipts`
            }
            deltaTone={
              salesGap === null || Math.abs(salesGap) < 1 ? "neutral" : "neg"
            }
            tooltip="Settlo minus TRA. Positive means sales were billed that the device never rang up."
          />
        </KpiStrip>

        <VfdStatusNotice availability={report.vfd} error={report.vfdError} />

        {report.rows.length > 0 ? (
          <>
            <ZReportTable data={report.rows} showVfd={showVfd} />
            {showVfd && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Fiscal days are struck in EAT by the device, business days by
                this location&apos;s session. A session running past midnight
                posts its late receipts under the next fiscal date, so small
                day-to-day differences that cancel out across the range are
                ordinary drift rather than missing sales.
              </p>
            )}
          </>
        ) : (
          <NoItems itemName="Z-reports" />
        )}
      </PageBody>
    </PageShell>
  );
}
