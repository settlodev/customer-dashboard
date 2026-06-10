import { format, subDays } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { StockReportDateFilter } from "@/components/reports/stock/stock-report-date-filter";
import {
  StockTabNav,
  type StockTab,
} from "@/components/reports/stock/stock-tab-nav";
import { ActivityTab } from "./_tabs/activity-tab";
import { AgingTab } from "./_tabs/aging-tab";
import { LevelsTab } from "./_tabs/levels-tab";
import { MovementTab } from "./_tabs/movement-tab";
import { OverviewTab } from "./_tabs/overview-tab";
import { ReservationsTab } from "./_tabs/reservations-tab";
import { RiskTab } from "./_tabs/risk-tab";

const VALID_TABS: StockTab[] = [
  "overview",
  "levels",
  "movement",
  "risk",
  "aging",
  "reservations",
  "activity",
];

type Params = {
  searchParams: Promise<{
    tab?: string;
    asOf?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function StockReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const tab: StockTab = VALID_TABS.includes(resolved.tab as StockTab)
    ? (resolved.tab as StockTab)
    : "overview";

  // Two date axes for stock:
  //   asOf  — single date snapshot ("low stock as of today")
  //   from/to — period for trends ("value over the last 30 days")
  // Defaults: asOf=today, range=last 30 days. No day-session ties.
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const asOf = resolved.asOf ?? today;
  const from = resolved.from ?? format(subDays(now, 30), "yyyy-MM-dd");
  const to = resolved.to ?? today;

  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 50;
  const status = resolved.status ?? "";

  const subtitle = buildSubtitle(tab, asOf, from, to);

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Stock" }]} />
      <PageHeader title="Stock report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StockTabNav
            active={tab}
            preservedParams={{
              asOf: resolved.asOf,
              from: resolved.from,
              to: resolved.to,
              search: resolved.search,
              status: resolved.status,
              limit: resolved.limit,
            }}
          />
          <StockReportDateFilter asOf={asOf} from={from} to={to} />
        </div>

        {tab === "overview" && <OverviewTab asOf={asOf} from={from} to={to} />}
        {tab === "levels" && <LevelsTab />}
        {tab === "movement" && <MovementTab from={from} to={to} />}
        {tab === "risk" && <RiskTab asOf={asOf} />}
        {tab === "aging" && <AgingTab asOf={asOf} />}
        {tab === "reservations" && (
          <ReservationsTab page={page} limit={limit} status={status} />
        )}
        {tab === "activity" && (
          <ActivityTab page={page} limit={limit} from={from} to={to} />
        )}
      </PageBody>
    </PageShell>
  );
}

function buildSubtitle(tab: StockTab, asOf: string, from: string, to: string) {
  const asOfLabel = format(new Date(asOf), "MMM d, yyyy");
  const rangeLabel =
    from === to
      ? format(new Date(from), "MMM d, yyyy")
      : `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  switch (tab) {
    case "overview":
      return `Snapshot as of ${asOfLabel} · trends ${rangeLabel}`;
    case "levels":
    case "risk":
    case "aging":
    case "reservations":
      return `As of ${asOfLabel}`;
    case "movement":
    case "activity":
      return `Activity ${rangeLabel}`;
    default:
      return `As of ${asOfLabel}`;
  }
}

