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
import { columns } from "@/components/tables/stock-transfer/column";
import { searchStockTransfers } from "@/lib/actions/stock-transfer-actions";
import { Plus, ArrowLeftRight, Truck, Clock, ShieldCheck } from "lucide-react";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;

  const responseData = await searchStockTransfers(page ? page - 1 : 0, pageLimit);

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Transfers" }]} />
      <PageHeader
        title="Stock Transfers"
        subtitle="Move stock between locations, stores, and warehouses."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-transfers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ArrowLeftRight className="h-3 w-3" />}
            label="Transfers (30d)"
            value="22"
            delta="+5 wk"
            deltaTone="pos"
            spark={[5, 7, 8, 10, 12, 14, 16, 18]}
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="In transit"
            value="4"
            unit="active"
            delta="2 due today"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<Clock className="h-3 w-3" />}
            label="Avg lead time"
            value="2.4"
            unit="days"
            delta="−0.3 d"
            deltaTone="pos"
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="On-time arrivals"
            value="94"
            unit="%"
            delta="+1.5 pts"
            deltaTone="pos"
          />
        </KpiStrip>

        {total > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="transferNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
          />
        ) : (
          <NoItems newItemUrl="/stock-transfers/new" itemName="stock transfers" />
        )}
      </PageBody>
    </PageShell>
  );
}
