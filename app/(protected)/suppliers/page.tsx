import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/supplier/columns";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";

type Props = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = parseListStatus(params.status);
  const q = (params.search ?? "").trim().toLowerCase();
  const page = Number(params.page) || 0;
  const pageLimit = Number(params.limit) || 25;

  const all = await fetchAllSuppliers();

  const scope =
    status === "archived"
      ? all.filter((s) => !!s.archivedAt)
      : all.filter((s) => !s.archivedAt);

  const filtered = q
    ? scope.filter((s) =>
        [s.name, s.contactPersonName, s.email, s.phone]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q)),
      )
    : scope;

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const pageIndex = page > 0 ? page - 1 : 0;
  const start = pageIndex * pageLimit;
  const data = sorted.slice(start, start + pageLimit);
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageLimit));

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Suppliers" }]} />
      <PageHeader
        title="Suppliers"
        subtitle="Vendors that fulfil purchase orders."
        actions={
          <Button asChild>
            <Link href="/suppliers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add supplier
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/suppliers" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
                rowClickBasePath="/suppliers"
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="suppliers" newItemUrl="/suppliers/new" />
        )}
      </PageBody>
    </PageShell>
  );
}
