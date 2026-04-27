import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/customer/column";
import { searchCustomer } from "@/lib/actions/customer-actions";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Customer } from "@/types/customer/type";
import NoItems from "@/components/layouts/no-items";
import { Plus, Users } from "lucide-react";

const breadcrumbItems = [{ title: "Customers", link: "/customers" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchCustomer(q, page, pageLimit);

  const data: Customer[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/customers/groups">
              <Users className="mr-1.5 h-4 w-4" />
              Groups
            </Link>
          </Button>
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageNo={page}
              searchKey="firstName"
              total={total}
              rowClickBasePath="/customers"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName="customers" newItemUrl="/customers/new" />
      )}
    </div>
  );
}
