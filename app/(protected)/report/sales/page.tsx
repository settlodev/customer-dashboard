import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { SalesReportExportButton } from "@/components/reports/sales/sales-report-export-button";
import { SalesTabNav, type SalesTab } from "@/components/reports/sales/sales-tab-nav";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { hasEntityFeature } from "@/lib/actions/entitlement-actions";
import { getTableStats } from "@/lib/actions/space-actions";
import { type TopSellingSortBy } from "@/types/reports/top-selling";
import { ByCategoryTab } from "./_tabs/by-category-tab";
import { ByDepartmentTab } from "./_tabs/by-department-tab";
import { ByProductTab } from "./_tabs/by-product-tab";
import { ByStaffTab } from "./_tabs/by-staff-tab";
import { ByTableTab } from "./_tabs/by-table-tab";

// "table" is appended at runtime only when the location actually runs a
// table system (see hasTables below).
const BASE_TABS: SalesTab[] = ["staff", "product", "category"];
const VALID_SORTS: TopSellingSortBy[] = ["revenue", "quantity", "profit"];

type Params = {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort?: string;
  }>;
};

export default async function SalesReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  // "By department" is gated on the DEPARTMENTS_MODULE entitlement (every
  // location has a default department, so a count check wouldn't work). "By
  // table" only surfaces for locations that run a table system — getTableStats
  // is light (counts only); fetching table names happens in the tab itself.
  const [tableStats, location] = await Promise.all([
    getTableStats().catch(() => null),
    getCurrentLocation().catch(() => null),
  ]);
  const hasTables = (tableStats?.total ?? 0) > 0;
  const hasDepartments = location?.id
    ? await hasEntityFeature(location.id, "DEPARTMENTS_MODULE")
    : true;

  const validTabs: SalesTab[] = [...BASE_TABS];
  if (hasDepartments) validTabs.push("department");
  if (hasTables) validTabs.push("table");

  const tab: SalesTab = validTabs.includes(resolved.tab as SalesTab)
    ? (resolved.tab as SalesTab)
    : "staff";

  // Default to the current month — keeps the first paint scoped, matching
  // every other reporting screen.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const search = resolved.search ?? "";
  const sortBy: TopSellingSortBy = VALID_SORTS.includes(
    resolved.sort as TopSellingSortBy,
  )
    ? (resolved.sort as TopSellingSortBy)
    : "revenue";

  const subtitle =
    from === to
      ? `Sales on ${format(new Date(from), "MMM d, yyyy")}`
      : `Sales ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Sales" }]} />
      <PageHeader title="Sales report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SalesTabNav
            active={tab}
            tabs={validTabs}
            preservedParams={{ from: resolved.from, to: resolved.to }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <OrdersDateFilter from={from} to={to} />
            <SalesReportExportButton from={from} to={to} />
          </div>
        </div>

        {tab === "staff" && (
          <ByStaffTab
            from={from}
            to={to}
            search={search}
            page={page}
            limit={limit}
          />
        )}
        {tab === "product" && (
          <ByProductTab
            from={from}
            to={to}
            search={search}
            page={page}
            limit={limit}
            sortBy={sortBy}
          />
        )}
        {tab === "category" && <ByCategoryTab from={from} to={to} />}
        {tab === "department" && <ByDepartmentTab from={from} to={to} />}
        {tab === "table" && (
          <ByTableTab
            from={from}
            to={to}
            search={search}
            page={page}
            limit={limit}
          />
        )}
      </PageBody>
    </PageShell>
  );
}
