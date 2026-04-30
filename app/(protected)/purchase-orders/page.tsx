import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  DollarSign,
  Truck,
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
import { columns, LpoRow } from "@/components/tables/lpo/columns";
import { getLpos } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { LpoStatus } from "@/types/lpo/type";

const STATUS_VALUES: LpoStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
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
    getLpos(page ? page - 1 : 0, pageLimit, status),
    fetchAllSuppliers(),
  ]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: LpoRow[] = (responseData.content ?? []).map((l) => ({
    ...l,
    supplierName: supplierMap[l.supplierId] ?? null,
  }));
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Purchase Orders" }]} />
      <PageHeader
        title="Purchase Orders"
        subtitle="Local purchase orders sent to suppliers — track approval, receipt, and reconciliation."
        actions={
          <Button asChild size="sm">
            <Link href="/purchase-orders/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Purchase Order
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<ShoppingCart className="h-3 w-3" />}
            label="Open POs"
            value="14"
            unit="active"
            delta="3 awaiting receipt"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<DollarSign className="h-3 w-3" />}
            label="Committed (30d)"
            value="124,500,000"
            unit="TZS"
            delta="+8.2% wk"
            deltaTone="pos"
            spark={[40, 50, 55, 60, 70, 80, 95, 110]}
          />
          <KpiCard
            icon={<Truck className="h-3 w-3" />}
            label="On-time receipt rate"
            value="91"
            unit="%"
            delta="+2 pts"
            deltaTone="pos"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Overdue"
            value="2"
            delta="follow up"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="lpoNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            filterKey="status"
            filterOptions={STATUS_VALUES.map((s) => ({
              value: s,
              label: s.replace("_", " "),
            }))}
          />
        ) : (
          <NoItems
            newItemUrl="/purchase-orders/new"
            itemName="purchase orders"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
