import Link from "next/link";
import { Plus, FileText, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
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
import { columns } from "@/components/tables/requisition/columns";
import { getRequisitions } from "@/lib/actions/requisition-actions";
import type { RequisitionStatus } from "@/types/requisition/type";

const STATUS_VALUES: RequisitionStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CONVERTED_TO_LPO",
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

  const responseData = await getRequisitions(
    page ? page - 1 : 0,
    pageLimit,
    status,
  );

  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Purchase Requisitions" }]} />
      <PageHeader
        title="Purchase Requisitions"
        subtitle="Internal requests for stock — submit, approve, then convert to LPOs."
        actions={
          <Button asChild size="sm">
            <Link href="/purchase-requisitions/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Requisition
            </Link>
          </Button>
        }
      />
      <PageBody>
        {/* Placeholder KPIs — wire to real aggregates later. */}
        <KpiStrip cols={4}>
          <KpiCard
            icon={<FileText className="h-3 w-3" />}
            label="Open requisitions"
            value="9"
            unit="active"
            delta="3 awaiting approval"
            deltaTone="neutral"
          />
          <KpiCard
            icon={<ShieldCheck className="h-3 w-3" />}
            label="Approved (30d)"
            value="42"
            delta="+6 wk"
            deltaTone="pos"
            spark={[18, 22, 24, 28, 30, 34, 38, 40]}
          />
          <KpiCard
            icon={<Clock className="h-3 w-3" />}
            label="Avg approval time"
            value="11"
            unit="hrs"
            delta="−1.5 hr"
            deltaTone="pos"
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Rejected (30d)"
            value="3"
            delta="needs review"
            deltaTone="neg"
          />
        </KpiStrip>

        {total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="requisitionNumber"
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
            newItemUrl="/purchase-requisitions/new"
            itemName="purchase requisitions"
          />
        )}
      </PageBody>
    </PageShell>
  );
}
