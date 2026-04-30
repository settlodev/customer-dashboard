import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { Plus, Activity, ArrowDownRight, ArrowUpRight, AlertTriangle } from "lucide-react";
import {
  MODIFICATION_CATEGORY_OPTIONS,
  ModificationCategory,
} from "@/types/stock-modification/type";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    category?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const category = MODIFICATION_CATEGORY_OPTIONS.some(
    (o) => o.value === resolvedParams.category,
  )
    ? (resolvedParams.category as ModificationCategory)
    : undefined;

  const responseData = await searchStockModifications(
    page ? page - 1 : 0,
    pageLimit,
    category,
  );

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Modifications" }]} />
      <PageHeader
        title="Stock Modifications"
        subtitle="Adjust stock for damages, losses, write-offs, and reclassifications."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-modifications/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Modify Stock
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Activity className="h-3 w-3" />}
            label="Modifications (30d)"
            value="58"
            delta="+12 wk"
            deltaTone="pos"
            spark={[20, 22, 26, 28, 30, 36, 42, 50]}
          />
          <KpiCard
            icon={<ArrowUpRight className="h-3 w-3" />}
            label="Net adjustment up"
            value="+1,420"
            unit="units"
            deltaTone="pos"
          />
          <KpiCard
            icon={<ArrowDownRight className="h-3 w-3" />}
            label="Net adjustment down"
            value="−980"
            unit="units"
            deltaTone="neg"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="High-cost write-offs"
            value="4"
            delta="approval pending"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || category ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="modificationNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            rowClickBasePath="/stock-modifications"
            filterKey="category"
            filterOptions={MODIFICATION_CATEGORY_OPTIONS.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
          />
        ) : (
          <NoItems newItemUrl="/stock-modifications/new" itemName="stock modifications" />
        )}
      </PageBody>
    </PageShell>
  );
}
