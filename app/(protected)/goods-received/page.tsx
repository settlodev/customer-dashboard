import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { getGrns } from "@/lib/actions/procurement-actions";
import { Grn, GRN_STATUS_LABELS } from "@/types/procurement/type";
import Link from "next/link";

const breadcrumbItems = [{ title: "Goods Received", link: "/goods-received" }];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;

  const responseData = await getGrns(page ? page - 1 : 0, pageLimit);
  const data: Grn[] = responseData.content;
  const total = responseData.totalElements;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
      </div>

      {total > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">GRN Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((grn) => (
                    <tr key={grn.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link href={`/goods-received/${grn.id}`} className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline">
                          {grn.grnNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grn.supplierName || "\u2014"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grn.items?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          grn.status === "RECEIVED" ? "bg-green-50 text-green-700" :
                          grn.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {GRN_STATUS_LABELS[grn.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(grn.receivedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[calc(100vh-240px)] border border-dashed rounded-xl">
          <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
            <h1 className="text-lg font-bold">No goods received yet</h1>
            <p className="text-sm text-muted-foreground">GRN records will appear here when you receive goods from suppliers.</p>
          </div>
        </div>
      )}
    </div>
  );
}
