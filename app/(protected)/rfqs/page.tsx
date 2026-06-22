import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/rfq/columns";
import { getRfqs } from "@/lib/actions/rfq-actions";
import { softFetch } from "@/lib/list-fallback";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getRfqKpi } from "@/lib/actions/reports-analytics-actions";
import { RfqKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { RfqStatus } from "@/types/rfq/type";

const STATUS_VALUES: RfqStatus[] = [
  "DRAFT",
  "SENT",
  "QUOTES_RECEIVED",
  "EVALUATED",
  "AWARDED",
  "CONVERTED_TO_LPO",
  "CANCELLED",
  "EXPIRED",
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

  const [responseData, config, location] = await Promise.all([
    softFetch(getRfqs(page ? page - 1 : 0, pageLimit, status)),
    getLocationConfig(),
    getCurrentLocation(),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;
  const rfqEnabled = config?.rfqEnabled ?? false;

  const kpi = location?.id ? await getRfqKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Requests for Quotation" }]} />
      <PageHeader
        title="Requests for Quotation"
        subtitle="Raise quotes from multiple suppliers, evaluate, and award."
        actions={
          rfqEnabled ? (
            <Button asChild size="sm">
              <Link href="/rfqs/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New RFQ
              </Link>
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        {!rfqEnabled && (
          <Alert tone="warning">
            <AlertIcon>
              <Lock className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>RFQs disabled</AlertTitle>
              <AlertDescription>
                Ask an admin to toggle{" "}
                <code className="font-mono">rfqEnabled</code> in location
                settings to raise quotes from multiple suppliers.
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}

        {!responseData ? (
          <DataLoadError itemName="RFQs" />
        ) : total > 0 || status ? (
          <>
            <RfqKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="rfqNumber"
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
          </>
        ) : rfqEnabled ? (
          <NoItems newItemUrl="/rfqs/new" itemName="RFQs" />
        ) : null}
      </PageBody>
    </PageShell>
  );
}
