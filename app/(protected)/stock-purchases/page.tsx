import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { getLpos } from "@/lib/actions/procurement-actions";
import { Lpo, LPO_STATUS_LABELS } from "@/types/procurement/type";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Purchase Orders", link: "/stock-purchases" }];

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

  const responseData = await getLpos(page ? page - 1 : 0, pageLimit);
  const data: Lpo[] = responseData.content;
  const total = responseData.totalElements;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stock-purchases/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      {total > 0 ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">LPO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((lpo) => (
                    <tr key={lpo.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link href={`/stock-purchases/${lpo.id}`} className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline">
                          {lpo.lpoNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lpo.supplierName || "\u2014"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lpo.items?.length ?? 0}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {lpo.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          lpo.status === "RECEIVED" ? "bg-green-50 text-green-700" :
                          lpo.status === "CANCELLED" ? "bg-red-50 text-red-700" :
                          lpo.status === "SENT" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {LPO_STATUS_LABELS[lpo.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(lpo.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-purchases/new" itemName="purchase orders" />
      )}
    </div>
  );
}
