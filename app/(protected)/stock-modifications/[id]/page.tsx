import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockModification } from "@/lib/actions/stock-modification-actions";
import StockModificationForm from "@/components/forms/stock_modification_form";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import { MODIFICATION_CATEGORY_OPTIONS } from "@/types/stock-modification/type";

type Params = Promise<{ id: string }>;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function StockModificationPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    // Modifications are read-only after creation
    const item = await getStockModification(resolvedParams.id);
    if (!item) notFound();

    const breadcrumbItems = [
      { title: "Stock Modifications", link: "/stock-modifications" },
      { title: item.modificationNumber, link: "" },
    ];

    const currency = item.currency || DEFAULT_CURRENCY;
    const categoryLabel =
      MODIFICATION_CATEGORY_OPTIONS.find((o) => o.value === item.category)?.label ??
      item.category;
    const hasForeignLine = item.items?.some(
      (line) => line.originalCurrency && line.originalCurrency !== (line.currency || currency),
    );
    const netChange = item.items?.reduce((sum, line) => sum + Number(line.quantityChange), 0) ?? 0;

    return (
      <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
        <div className="space-y-6">
          <BreadcrumbsNav items={breadcrumbItems} />
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">{item.modificationNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {categoryLabel} — {item.reason}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Settlement currency:</span>
              <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{currency}</span>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Date" value={formatDate(item.modificationDate) ?? "—"} />
              <Meta label="Performed by" value={item.performedByName || "—"} />
              <Meta label="Location" value={item.locationName || "—"} />
              <Meta
                label="Net change"
                value={netChange > 0 ? `+${netChange.toLocaleString()}` : netChange.toLocaleString()}
                tone={netChange > 0 ? "positive" : netChange < 0 ? "negative" : "neutral"}
              />
            </CardContent>
          </Card>

          {item.items && item.items.length > 0 && (
            <Card>
              <CardContent className="px-2 sm:px-6 pt-6">
                <h3 className="text-lg font-medium mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Previous</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Change</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">New Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                        {hasForeignLine && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Originally</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {item.items.map((line) => {
                        const lineCurrency = line.currency || currency;
                        const isForeign =
                          line.originalCurrency && line.originalCurrency !== lineCurrency;
                        const signed = line.quantityChange > 0 ? `+${line.quantityChange.toLocaleString()}` : line.quantityChange.toLocaleString();
                        return (
                          <tr key={line.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{line.variantName}</td>
                            <td className="px-4 py-3 text-right text-gray-600">{line.previousQuantity.toLocaleString()}</td>
                            <td className={`px-4 py-3 text-right font-medium ${line.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>
                              {signed}
                            </td>
                            <td className="px-4 py-3 text-right">{line.newQuantity.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">
                              {line.unitCost != null ? (
                                <Money amount={line.unitCost} currency={lineCurrency} />
                              ) : (
                                "—"
                              )}
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {item.notes && (
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{item.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { title: "Stock Modifications", link: "/stock-modifications" },
    { title: "New", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl font-bold">Stock Modification</h1>
          <p className="text-sm text-muted-foreground">Record a stock adjustment</p>
        </div>
        <StockModificationForm />
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-green-700"
      : tone === "negative"
        ? "text-red-600"
        : "text-gray-900";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className={`font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}
