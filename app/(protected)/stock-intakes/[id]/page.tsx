import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import { STOCK_INTAKE_RECORD_STATUS_LABELS } from "@/types/stock-intake-record/type";
import StockIntakeForm from "@/components/forms/stock_intake_form";
import { Card, CardContent } from "@/components/ui/card";
import StockIntakeRecordActions from "@/components/widgets/stock-intake-record-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";

type Params = Promise<{ id: string }>;

export default async function StockIntakePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (isNewItem) {
    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <div>
            <div className="hidden sm:block mb-2">
              <BreadcrumbsNav items={[
                { title: "Stock Received", link: "/stock-intakes" },
                { title: "New", link: "" },
              ]} />
            </div>
            <h1 className="text-2xl font-bold">Record Stock Intake</h1>
            <p className="text-sm text-muted-foreground">Add stock quantities and costs to your inventory</p>
          </div>
          <StockIntakeForm />
        </div>
      </div>
    );
  }

  const item = await getStockIntakeRecord(resolvedParams.id);
  if (!item) notFound();

  const statusColor =
    item.status === "CONFIRMED" ? "bg-green-50 text-green-700" :
    item.status === "CANCELLED" ? "bg-red-50 text-red-700" :
    "bg-amber-50 text-amber-700";

  const currency = item.currency || DEFAULT_CURRENCY;
  const hasForeignLine = item.items?.some(
    (line) =>
      line.originalCurrency &&
      line.originalCurrency !== (line.currency || currency),
  );

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <BreadcrumbsNav items={[
          { title: "Stock Received", link: "/stock-intakes" },
          { title: item.referenceNumber, link: "" },
        ]} />

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{item.referenceNumber}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                {STOCK_INTAKE_RECORD_STATUS_LABELS[item.status]}
              </span>
            </div>
            {item.notes && <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>}
          </div>
          {item.status === "DRAFT" && <StockIntakeRecordActions id={item.id} />}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Items</p>
              <p className="text-2xl font-bold mt-1">{item.totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Total Qty</p>
              <p className="text-2xl font-bold mt-1">{item.totalQuantity.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Total Value</p>
              <p className="text-2xl font-bold mt-1">
                <Money amount={item.totalValue} currency={currency} />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Created</p>
              <p className="text-sm font-medium mt-1">
                {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Items table */}
        {item.items && item.items.length > 0 && (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-medium">Stock Items</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Settlement currency:</span>
                  <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{currency}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total</th>
                      {hasForeignLine && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Originally</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {item.items.map((line) => {
                      const lineCurrency = line.currency || currency;
                      const isForeign =
                        line.originalCurrency && line.originalCurrency !== lineCurrency;
                      return (
                        <tr key={line.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{line.stockVariantName}</td>
                          <td className="px-4 py-3 text-gray-500">{line.stockVariantSku || "—"}</td>
                          <td className="px-4 py-3 text-right">{line.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <Money amount={line.unitCost} currency={lineCurrency} />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            <Money amount={line.totalCost} currency={lineCurrency} />
                          </td>
                          {hasForeignLine && (
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {isForeign ? (
                                <div className="flex flex-col">
                                  <Money
                                    amount={line.originalUnitCost ?? 0}
                                    currency={line.originalCurrency}
                                  />
                                  {line.rateUsed != null && line.rateUsed !== 1 && (
                                    <span className="text-[10px]">
                                      @ {line.rateUsed.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-gray-500">{line.batchNumber || "—"}</td>
                          <td className="px-4 py-3 text-gray-500">{line.expiryDate || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
