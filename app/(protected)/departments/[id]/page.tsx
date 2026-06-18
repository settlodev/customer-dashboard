import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { UpgradeGate } from "@/components/widgets/upgrade-gate";
import { Department } from "@/types/department/type";
import { getDepartment } from "@/lib/actions/department-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getDepartmentItemSales } from "@/lib/actions/department-sales-actions";
import { hasEntityFeature } from "@/lib/actions/entitlement-actions";
import { DepartmentDetailView } from "./department-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  tab?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}>;

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolved = await searchParams;
  const tab = resolved.tab;

  // Adding a department is a sibling route now that /departments/[id] is a
  // detail view; editing moved to /departments/[id]/edit.
  if (id === "new") redirect("/departments/new");

  const location = await getCurrentLocation().catch(() => null);

  // DEPARTMENTS_MODULE entitlement gate — mirrors the /departments list page.
  if (location?.id) {
    const allowed = await hasEntityFeature(location.id, "DEPARTMENTS_MODULE");
    if (!allowed) {
      return (
        <PageShell>
          <PageBreadcrumbs
            items={[
              { title: "Departments", href: "/departments" },
              { title: "Details" },
            ]}
          />
          <PageHeader title="Department" />
          <PageBody>
            <UpgradeGate
              featureName="Departments"
              description="Multi-department management is available on Professional and Enterprise plans. Your location still has a default Main department for day-to-day use."
            />
          </PageBody>
        </PageShell>
      );
    }
  }

  let department: Department | null = null;
  try {
    department = await getDepartment(id);
    if (!department) notFound();
  } catch {
    notFound();
  }

  // Sales period — defaults to the current month, matching the report hub.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const pageNo = Number(resolved.page) || 1; // 1-based in the URL
  const limit = Number(resolved.limit) || 10;

  // The department's items are aggregated + paginated by the Reports Service,
  // so the browser only loads the current page (works at any catalogue size).
  // KPIs come from server-computed totals for the whole department.
  const [currency, sales] = await Promise.all([
    getLocationCurrency().catch(() => "TZS"),
    getDepartmentItemSales({
      departmentId: id,
      from,
      to,
      page: pageNo - 1,
      size: limit,
      sort: resolved.sort,
      search: resolved.search,
    }),
  ]);

  const statusLabel = department.active ? "Active" : "Inactive";
  const statusClass = department.active
    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Departments", href: "/departments" },
          { title: department.name },
        ]}
      />
      <PageHeader
        title={department.name}
        titleAccessory={
          <span className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
            {department.isDefault && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                Default
              </span>
            )}
          </span>
        }
        subtitle={department.description ?? undefined}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/departments/${department.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <DepartmentDetailView
          department={department}
          currency={currency}
          from={from}
          to={to}
          sales={{
            totals: sales.totals,
            items: sales.items.content,
            pageCount: sales.items.totalPages,
            pageNo: pageNo - 1,
            total: sales.items.totalElements,
          }}
          initialTab={tab}
        />
      </PageBody>
    </PageShell>
  );
}
