import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { softFetch } from "@/lib/list-fallback";
import { columns } from "@/components/tables/discount/columns";
import { fetchAllDiscounts } from "@/lib/actions/discount-actions";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams.search || "").trim().toLowerCase();
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit) || 10;
  const status = parseListStatus(resolvedSearchParams.status);

  // `GET /api/v1/discounts` returns the whole flat list (no page envelope),
  // so filtering, status split, and pagination all happen here — mirrors
  // how the categories list page handles fetchCategoriesHierarchical.
  const all = await softFetch(fetchAllDiscounts());

  let rows = (all ?? []).filter((d) => (status === "archived" ? !d.active : d.active));

  if (q) {
    rows = rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.couponCode?.toLowerCase().includes(q) ?? false),
    );
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageLimit));
  const startIdx = (page > 0 ? page - 1 : 0) * pageLimit;
  const data = rows.slice(startIdx, startIdx + pageLimit);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Discounts" }]} />
      <PageHeader
        title="Discounts"
        subtitle="Discount rules applied automatically or via coupon at checkout."
        actions={
          <Button asChild>
            <Link href="/discounts/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Discount
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/discounts" value={status} />

        {!all ? (
          <DataLoadError itemName="discounts" />
        ) : total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
                rowClickBasePath="/discounts"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="discounts" newItemUrl="/discounts/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
