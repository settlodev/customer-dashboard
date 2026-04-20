import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/rfq/columns";
import { getRfqs } from "@/lib/actions/rfq-actions";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import type { RfqStatus } from "@/types/rfq/type";

const breadcrumbItems = [{ title: "Requests for Quotation", link: "/rfqs" }];

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

  const [responseData, config] = await Promise.all([
    getRfqs(page ? page - 1 : 0, pageLimit, status),
    getLocationConfig(),
  ]);

  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;
  const rfqEnabled = config?.rfqEnabled ?? false;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        {rfqEnabled && (
          <Button asChild>
            <Link href="/rfqs/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New RFQ
            </Link>
          </Button>
        )}
      </div>

      {!rfqEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Requests for Quotation aren&apos;t enabled for this location. Ask
            an admin to toggle <code>rfqEnabled</code> in location settings to
            raise quotes from multiple suppliers.
          </span>
        </div>
      )}

      {total > 0 || status ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
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
          </CardContent>
        </Card>
      ) : rfqEnabled ? (
        <NoItems newItemUrl="/rfqs/new" itemName="RFQs" />
      ) : null}
    </div>
  );
}
