import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/device/columns";
import { searchDevices } from "@/lib/actions/devices-actions";
import { Button } from "@react-email/components";
import Link from "next/link";

const breadcrumbItems = [{ title: "Devices", link: "/devices" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchDevices(q, page, pageLimit);

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 mt-10">
      <div className="flex items-center justify-between mb-2">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>

        <div className="flex items-center space-x-2">
          <Button>
            <Link key="add-space" href={`/devices/new`}>
              Link Device
            </Link>
          </Button>
        </div>
      </div>

      {total > 0 || q != "" ? (
        <Card x-chunk="data-table">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>
              List of devices connected to your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              pageCount={pageCount}
              pageNo={page}
              searchKey="invoiceNumber"
              total={total}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems itemName={`Device`} newItemUrl={`/devices`} />
      )}
    </div>
  );
}
