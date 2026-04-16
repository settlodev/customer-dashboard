import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { searchOpeningStocks } from "@/lib/actions/opening-stock-actions";
import { getGrns } from "@/lib/actions/procurement-actions";
import { Plus } from "lucide-react";
import type { OpeningStock } from "@/types/opening-stock/type";
import { OPENING_STOCK_STATUS_LABELS } from "@/types/opening-stock/type";
import type { Grn } from "@/types/procurement/type";
import { GRN_STATUS_LABELS } from "@/types/procurement/type";

const breadcrumbItems = [{ title: "Stock Received", link: "/stock-intakes" }];

// Unified row shape for the combined list
type StockReceivedRow = {
  id: string;
  source: "STOCK_INTAKE" | "GRN";
  reference: string;
  itemNames: string[];
  itemCount: number;
  totalQty: number;
  totalValue: number;
  supplier: string | null;
  status: string;
  statusColor: string;
  date: string;
  detailHref: string;
};

function fromOpeningStock(os: OpeningStock): StockReceivedRow {
  const names = os.items?.map((i) => i.stockVariantName) ?? [];
  const statusDone = os.status === "CONFIRMED";
  const statusBad = os.status === "CANCELLED";
  return {
    id: os.id,
    source: "STOCK_INTAKE",
    reference: os.referenceNumber,
    itemNames: names,
    itemCount: os.totalItems,
    totalQty: os.totalQuantity,
    totalValue: os.totalValue,
    supplier: null,
    status: OPENING_STOCK_STATUS_LABELS[os.status],
    statusColor: statusDone ? "bg-green-50 text-green-700" : statusBad ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
    date: os.createdAt,
    detailHref: `/stock-intakes/${os.id}`,
  };
}

function fromGrn(grn: Grn): StockReceivedRow {
  const names = grn.items?.map((i) => i.variantName) ?? [];
  const totalQty = grn.items?.reduce((sum, i) => sum + i.receivedQuantity, 0) ?? 0;
  const totalValue = grn.items?.reduce((sum, i) => sum + (i.totalCost ?? i.receivedQuantity * i.unitCost), 0) ?? 0;
  const statusDone = grn.status === "RECEIVED";
  const statusBad = grn.status === "CANCELLED";
  return {
    id: grn.id,
    source: "GRN",
    reference: grn.grnNumber,
    itemNames: names,
    itemCount: grn.items?.length ?? 0,
    totalQty,
    totalValue,
    supplier: grn.supplierName ?? null,
    status: GRN_STATUS_LABELS[grn.status],
    statusColor: statusDone ? "bg-green-50 text-green-700" : statusBad ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
    date: grn.receivedDate ?? grn.createdAt,
    detailHref: `/goods-received/${grn.id}`,
  };
}

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 50;

  // Fetch both sources in parallel
  const [osData, grnData] = await Promise.all([
    searchOpeningStocks(page ? page - 1 : 0, pageLimit),
    getGrns(page ? page - 1 : 0, pageLimit),
  ]);

  // Normalize and merge
  const osRows = (osData.content as OpeningStock[]).map(fromOpeningStock);
  const grnRows = (grnData.content as Grn[]).map(fromGrn);
  const rows = [...osRows, ...grnRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const total = rows.length;

  const sourceBadge = (source: "STOCK_INTAKE" | "GRN") =>
    source === "GRN"
      ? "bg-blue-50 text-blue-700"
      : "bg-purple-50 text-purple-700";

  const sourceLabel = (source: "STOCK_INTAKE" | "GRN") =>
    source === "GRN" ? "Purchase" : "Stock Intake";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stock-intakes/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Record Stock
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Stock Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Supplier</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total Value</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr key={`${row.source}-${row.id}`} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link href={row.detailHref} className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded hover:underline">
                          {row.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceBadge(row.source)}`}>
                          {sourceLabel(row.source)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px]">
                        {row.itemNames.length > 0 ? (
                          <span className="line-clamp-2">
                            {row.itemNames.slice(0, 3).join(", ")}
                            {row.itemNames.length > 3 && <span className="text-gray-400"> +{row.itemNames.length - 3} more</span>}
                          </span>
                        ) : (
                          <span className="text-gray-400">{row.itemCount} item{row.itemCount !== 1 ? "s" : ""}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.supplier || "\u2014"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.totalQty?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{row.totalValue?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-intakes/new" itemName="stock received" />
      )}
    </div>
  );
}
