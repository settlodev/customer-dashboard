import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/supplier-refund/columns";
import { listOwedRefunds } from "@/lib/actions/supplier-refund-actions";
import { softFetch } from "@/lib/list-fallback";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

type Params = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function Page({ searchParams }: Params) {
  const params = await searchParams;
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  const response = await softFetch(listOwedRefunds(apiPage, size));
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Refunds owed" }]} />
      <PageHeader
        title="Refunds owed"
        subtitle="Cash suppliers owe you for returns that exceeded the bill — record each refund when it arrives."
      />
      <PageBody>
        {!response ? (
          <DataLoadError itemName="supplier refunds" />
        ) : total > 0 ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="refundNumber"
            pageNo={apiPage}
            total={total}
            pageCount={pageCount}
            defaultPageSize={size}
            disableArchive
          />
        ) : (
          <NoItems itemName="refunds owed" />
        )}
      </PageBody>
    </PageShell>
  );
}
