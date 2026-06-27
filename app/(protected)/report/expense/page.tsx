import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { ExpenseReportExportButton } from "@/components/reports/expenses/expense-report-export-button";
import {
  ExpenseTabNav,
  type ExpenseTab,
} from "@/components/reports/expenses/expense-tab-nav";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { ByCategoryTab } from "./_tabs/by-category-tab";
import { ByStatusTab } from "./_tabs/by-status-tab";

const TABS: ExpenseTab[] = ["category", "status"];

type Params = {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function ExpenseReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const tab: ExpenseTab = TABS.includes(resolved.tab as ExpenseTab)
    ? (resolved.tab as ExpenseTab)
    : "category";

  // Default to the current month — matches the Sales report's default window.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const location = await getCurrentLocation().catch(() => null);

  const subtitle =
    from === to
      ? `Expenses on ${format(new Date(from), "MMM d, yyyy")}`
      : `Expenses ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Reports", href: "/dashboard" },
          { title: "Expense report" },
        ]}
      />
      <PageHeader title="Expense report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ExpenseTabNav
            active={tab}
            tabs={TABS}
            preservedParams={{ from: resolved.from, to: resolved.to }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <OrdersDateFilter from={from} to={to} />
            <ExpenseReportExportButton from={from} to={to} />
          </div>
        </div>

        {tab === "category" && (
          <ByCategoryTab from={from} to={to} locationId={location?.id} />
        )}
        {tab === "status" && (
          <ByStatusTab from={from} to={to} locationId={location?.id} />
        )}
      </PageBody>
    </PageShell>
  );
}
