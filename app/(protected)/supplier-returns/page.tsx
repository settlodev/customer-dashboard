import Link from "next/link";
import {
  Plus,
  RotateCcw,
  Truck,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
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
import {
  columns,
  SupplierReturnRow,
} from "@/components/tables/supplier-return/columns";
import { getSupplierReturns } from "@/lib/actions/supplier-return-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { SupplierReturnStatus } from "@/types/supplier-return/type";

const STATUS_VALUES: SupplierReturnStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

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

  const [responseData, suppliers] = await Promise.all([
    getSupplierReturns(page ? page - 1 : 0, pageLimit, status),
    fetchAllSuppliers(),
  ]);
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: SupplierReturnRow[] = (responseData.content ?? []).map((r) => ({
    ...r,
    supplierName: supplierMap[r.supplierId] ?? null,
  }));
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Supplier Returns" }]} />
      <PageHeader
        title="Supplier Returns"
        subtitle="Send goods back to suppliers — track dispatch, completion, and credit notes."
        actions={
          <Button asChild size="sm">
            <Link href="/supplier-returns/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Return
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<RotateCcw className="h-3 w-3" />}
            label="Returns (30d)"
            value="14"
            delta="+3 wk"
            deltaTone="pos"
            spark={[2, 4, 5, 6, 8, 10, 12, 13]}
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="In transit"
            value="3"
            unit="active"
            delta="1 due today"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Credit due"
            value="4,820,000"
            unit="TZS"
            delta="awaiting credit notes"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Disputes"
            value="1"
            delta="needs review"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="returnNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            filterKey="status"
            filterOptions={STATUS_VALUES.map((s) => ({
              value: s,
              label: s.replace(/_/g, " "),
            }))}
          />
        ) : (
          <NoItems
            newItemUrl="/supplier-returns/new"
            itemName="supplier returns"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
