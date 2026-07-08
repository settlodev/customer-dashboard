import { format, subDays } from "date-fns";
import { requireReportsReadAll } from "@/lib/auth-utils";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { PackagingDateFilter } from "@/components/reports/packaging/packaging-date-filter";
import {
  PackagingTabNav,
  type PackagingTab,
} from "@/components/reports/packaging/packaging-tab-nav";
import { DepositTab } from "./_tabs/deposit-tab";
import { FlowTab } from "./_tabs/flow-tab";

type Params = {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function PackagingReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();
  const tab: PackagingTab = resolved.tab === "flow" ? "flow" : "deposit";

  // Single from/to range (last 30 days by default) — see
  // PackagingDateFilter for why there's no separate "as of" axis here.
  const now = new Date();
  const from = resolved.from ?? format(subDays(now, 30), "yyyy-MM-dd");
  const to = resolved.to ?? format(now, "yyyy-MM-dd");

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Packaging" }]} />
      <PageHeader
        title="Packaging report"
        subtitle="Deposits, empties on hand, and container flow"
      />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PackagingTabNav
            active={tab}
            preservedParams={{
              from: resolved.from,
              to: resolved.to,
            }}
          />
          <PackagingDateFilter from={from} to={to} />
        </div>

        {tab === "deposit" && <DepositTab />}
        {tab === "flow" && <FlowTab from={from} to={to} />}
      </PageBody>
    </PageShell>
  );
}
