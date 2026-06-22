import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/proforma-invoice/column";
import { searchProformaInvoices } from "@/lib/actions/proforma-actions";
import { softFetch } from "@/lib/list-fallback";
import { Proforma } from "@/types/proforma/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await softFetch(
    searchProformaInvoices(q, page, pageLimit),
  );

  const data: Proforma[] = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Proforma Invoices" }]} />
      <PageHeader
        title="Proforma Invoices"
        subtitle="Manage proforma invoices for your business"
        actions={
          <>
            <Button>
              <Link href="/proforma-invoice/new">Add Proforma Invoice</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="proforma invoices" />
        ) : total > 0 || q !== "" ? (
          <Card x-chunk="data-table">
            <CardHeader>
              <CardTitle>Proforma Invoices</CardTitle>
              <CardDescription>
                Manage proforma invoices for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={data}
                searchKey="invoiceNumber"
                pageNo={page}
                total={total}
                pageCount={pageCount}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems
            newItemUrl="/proforma-invoice/new"
            itemName="proforma invoices"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

export default Page;
