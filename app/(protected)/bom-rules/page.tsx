import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/bom-rule/column";
import { getBomRulesPage } from "@/lib/actions/bom-rule-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getBomRulesKpi } from "@/lib/actions/reports-analytics-actions";
import { BomRulesKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import { softFetch } from "@/lib/list-fallback";
import { BOM_LIFECYCLE_LABELS, BomLifecycleStatus } from "@/types/bom/type";

const BOM_STATUS_VALUES: BomLifecycleStatus[] = ["DRAFT", "ACTIVE", "DEPRECATED"];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }>;
};

export default async function BomRulesPage({ searchParams }: Params) {
  const resolved = await searchParams;
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 20;
  const status = BOM_STATUS_VALUES.find((s) => s === resolved.status);
  const search = resolved.search?.trim() || undefined;
  // Keep the toolbar on screen when a filter yields zero rows, otherwise the
  // user lands on the empty state with no way to clear the filter.
  const hasFilters = Boolean(status || search);

  const [responseData, location] = await Promise.all([
    softFetch(
      getBomRulesPage({
        page: page ? page - 1 : 0,
        size: pageLimit,
        status,
        search,
      }),
    ),
    getCurrentLocation(),
  ]);
  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getBomRulesKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Consumption rules" }]} />
      <PageHeader
        title="Consumption rules"
        subtitle="Consumption rules and routings that drive stock deduction on every sale and production run."
        actions={
          <Button asChild size="sm">
            <Link href="/bom-rules/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New consumption rule
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="consumption rules" />
        ) : total > 0 || hasFilters ? (
          <>
            <BomRulesKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="name"
              searchPlaceholder="Search rule name…"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              disableArchive
              filterKey="status"
              filterOptions={BOM_STATUS_VALUES.map((s) => ({
                value: s,
                label: BOM_LIFECYCLE_LABELS[s],
              }))}
              manualFilter
            />
          </>
        ) : (
          <NoItems newItemUrl="/bom-rules/new" itemName="consumption rules" />
        )}
      </PageBody>
    </PageShell>
  );
}
