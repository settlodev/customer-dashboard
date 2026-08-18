import Link from "next/link";
import { Building2, CheckCircle2, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/vendor/columns";
import { listVendors } from "@/lib/actions/vendor-actions";

interface SearchParams {
  search?: string;
  page?: string;
  limit?: string;
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the backend's 0-based index and match the size default,
  // otherwise the pager skips a page and the "10" label undercounts the rows.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  const response = await listVendors(params.search, apiPage, size);
  const data = response.content ?? [];
  const total = response.totalElements ?? 0;
  const pageCount = response.totalPages ?? 0;

  const activeCount = data.filter((v) => v.active).length;
  const withSupplierLink = data.filter((v) => !!v.supplierId).length;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Vendors" }]} />
      <PageHeader
        title="Vendors"
        subtitle="Suppliers, contractors, and service providers your business pays."
        actions={
          <Button asChild size="sm">
            <Link href="/vendors/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New vendor
            </Link>
          </Button>
        }
      />
      <PageBody>
        {total > 0 || params.search ? (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Total vendors"
                value={String(total)}
              />
              <KpiCard
                icon={<CheckCircle2 className="h-3 w-3" />}
                label="Active on page"
                value={String(activeCount)}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Building2 className="h-3 w-3" />}
                label="Linked to suppliers"
                value={String(withSupplierLink)}
                delta={
                  withSupplierLink > 0
                    ? "via inventory catalog"
                    : "none linked"
                }
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  defaultPageSize={size}
                  pageNo={apiPage}
                  total={total}
                  searchKey="name"
                  rowClickBasePath="/vendors"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="vendors" newItemUrl="/vendors/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
