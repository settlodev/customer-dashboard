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
import { columns } from "@/components/tables/stock-transfer-request/column";
import { searchTransferRequests } from "@/lib/actions/stock-transfer-request-actions";
import { softFetch } from "@/lib/list-fallback";
import type { TransferRequestStatus } from "@/types/stock-transfer-request/type";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Declined", value: "DECLINED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TABS = [
  { key: "outgoing", label: "Raised" },
  { key: "incoming", label: "To approve" },
] as const;

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    direction?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 20;
  const direction = resolved.direction === "incoming" ? "incoming" : "outgoing";
  const status = (resolved.status || undefined) as
    | TransferRequestStatus
    | undefined;

  const responseData = await softFetch(
    searchTransferRequests(page ? page - 1 : 0, pageLimit, direction, status),
  );

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Requests" }]} />
      <PageHeader
        title="Stock Requests"
        subtitle="Request stock from another location, store, or warehouse — and approve requests sent to you."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-requests/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Request
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {TABS.map((tab) => {
            const params = new URLSearchParams();
            params.set("direction", tab.key);
            if (status) params.set("status", status);
            const active = direction === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/stock-requests?${params.toString()}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-ink shadow-sm"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {!responseData ? (
          <DataLoadError itemName="stock requests" />
        ) : total > 0 || status ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="requestNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            defaultPageSize={pageLimit}
            filterKey="status"
            filterOptions={STATUS_OPTIONS}
            manualFilter
          />
        ) : direction === "outgoing" ? (
          <NoItems newItemUrl="/stock-requests/new" itemName="stock requests" />
        ) : (
          <NoItems itemName="incoming requests" />
        )}
      </PageBody>
    </PageShell>
  );
}
