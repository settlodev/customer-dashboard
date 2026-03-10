import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/proforma-invoice/column";
import { searchProformaInvoices } from "@/lib/actions/proforma-actions";
import { Proforma } from "@/types/proforma/type";

const breadCrumbItems = [
  { title: "Proforma Invoices", link: "/proforma-invoice" },
];

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

  const responseData = await searchProformaInvoices(q, page, pageLimit);

  const data: Proforma[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6 mt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Link href="/proforma-invoice/new">New Proforma Invoice</Link>
          </Button>
        </div>
      </div>
      {total > 0 || q !== "" ? (
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
          newItemUrl="/proforma-invoices/new"
          itemName="proforma invoices"
        />
      )}
    </div>
  );
}

export default Page;
