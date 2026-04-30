import Link from "next/link";
import { Plus, ClipboardCheck, Boxes, Truck, AlertTriangle } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/grn/columns";
import { getGrns } from "@/lib/actions/grn-actions";

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

  const responseData = await getGrns(page ? page - 1 : 0, pageLimit);
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Goods Received" }]} />
      <PageHeader
        title="Goods Received"
        subtitle="Receipt notes against purchase orders — verify, accept, and post stock."
        actions={
          <Button asChild size="sm">
            <Link href="/goods-received/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New GRN
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ClipboardCheck className="h-3 w-3" />}
            label="GRNs (30d)"
            value="36"
            delta="+5 wk"
            deltaTone="pos"
            spark={[5, 8, 12, 16, 20, 24, 30, 34]}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Units received"
            value="9,420"
            delta="+1.8% wk"
            deltaTone="pos"
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="Pending posting"
            value="4"
            unit="GRNs"
            delta="2 over 24h"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Variance flags"
            value="3"
            delta="needs review"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="grnNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
          />
        ) : (
          <NoItems
            newItemUrl="/goods-received/new"
            itemName="goods received notes"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
