import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import {
  StaffTabNav,
  type StaffTab,
} from "@/components/reports/staffs/staff-tab-nav";
import { staffReport } from "@/lib/actions/staff-actions";
import { OverviewTab } from "./_tabs/overview-tab";
import { StaffDetailsTab } from "./_tabs/staff-details-tab";

const TABS: StaffTab[] = ["overview", "staff"];

type Params = {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function StaffReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const tab: StaffTab = TABS.includes(resolved.tab as StaffTab)
    ? (resolved.tab as StaffTab)
    : "overview";

  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const search = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  const report = await staffReport(from, to).catch(() => null);

  const subtitle =
    from === to
      ? `Staff performance on ${format(new Date(from), "MMM d, yyyy")}`
      : `Staff performance ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Staff report" },
        ]}
      />
      <PageHeader title="Staff report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StaffTabNav
            active={tab}
            tabs={TABS}
            preservedParams={{ from: resolved.from, to: resolved.to }}
          />
          <OrdersDateFilter from={from} to={to} />
        </div>

        {tab === "overview" && <OverviewTab report={report} />}
        {tab === "staff" && (
          <StaffDetailsTab
            report={report}
            search={search}
            page={page}
            limit={limit}
          />
        )}
      </PageBody>
    </PageShell>
  );
}
