import Link from "next/link";
import { Plus, Boxes, Layers, Truck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-intake-record/columns";
import { searchStockIntakeRecords } from "@/lib/actions/stock-intake-record-actions";
import {
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";

const STATUS_VALUES: StockIntakeRecordStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);

  const responseData = await searchStockIntakeRecords(
    page ? page - 1 : 0,
    pageLimit,
    status,
  );
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Intakes" }]} />
      <PageHeader
        title="Stock Intakes"
        subtitle="Record received goods and confirm batches into inventory."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-intakes/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Record intake
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Intakes (30d)"
            value="42"
            delta="+8 wk"
            deltaTone="pos"
            spark={[10, 12, 14, 13, 16, 18, 20, 22]}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Units received"
            value="12,840"
            delta="+1.6% wk"
            deltaTone="pos"
            spark={[600, 650, 700, 720, 760, 800, 820, 840]}
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="Awaiting confirmation"
            value="6"
            unit="drafts"
            delta="2 over 24h"
            deltaTone="neg"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Variance flags"
            value="3"
            delta="needs review"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="referenceNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            filterKey="status"
            filterOptions={STATUS_VALUES.map((s) => ({
              value: s,
              label: STOCK_INTAKE_RECORD_STATUS_LABELS[s],
            }))}
          />
        ) : (
          <NoItems newItemUrl="/stock-intakes/new" itemName="stock intakes" />
        )}
      </PageBody>
    </PageShell>
  );
}
