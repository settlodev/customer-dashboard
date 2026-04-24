import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import { getStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import {
  STOCK_INTAKE_RECORD_STATUS_LABELS,
  StockIntakeRecordStatus,
} from "@/types/stock-intake-record/type";
import StockIntakeRecordActions from "@/components/widgets/stock-intake-record-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import SerialNumbersViewer from "@/components/stock-intakes/serial-numbers-viewer";

type Params = Promise<{ id: string }>;

const STATUS_TONES: Record<StockIntakeRecordStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null | undefined) => {
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

export default async function StockIntakePage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const item = await getStockIntakeRecord(resolvedParams.id);
  if (!item) notFound();

  const currency = item.currency || DEFAULT_CURRENCY;
  const hasForeignLine = item.items?.some(
    (line) =>
      line.originalCurrency &&
      line.originalCurrency !== (line.currency || currency),
  );
  const hasSerialLine = item.items?.some(
    (line) => line.serialNumbers && line.serialNumbers.length > 0,
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <BreadcrumbsNav
        items={[
          { title: "Stock Intakes", link: "/stock-intakes" },
          { title: item.referenceNumber, link: "" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{item.referenceNumber}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONES[item.status]}`}
            >
              {STOCK_INTAKE_RECORD_STATUS_LABELS[item.status]}
            </span>
          </div>
          {item.notes && (
            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
          )}
        </div>
        {item.status === "DRAFT" && <StockIntakeRecordActions id={item.id} />}
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-400 uppercase">Supplier</p>
            <p className="text-sm font-medium mt-1 truncate">
              {item.supplierName || <span className="text-gray-400">—</span>}
            </p>
            {item.supplierReference && (
              <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                Ref: {item.supplierReference}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-400 uppercase">Items</p>
            <p className="text-2xl font-bold mt-1">{item.totalItems}</p>
            <p className="text-xs text-muted-foreground">
              {Number(item.totalQuantity ?? 0).toLocaleString()} total qty
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-400 uppercase">Total value</p>
            <p className="text-2xl font-bold mt-1">
              <Money amount={Number(item.totalValue ?? 0)} currency={currency} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-400 uppercase">Location</p>
            <p className="text-sm font-medium mt-1 truncate">
              {item.locationName || <span className="text-gray-400">—</span>}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{item.locationType}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dates panel */}
      <Card>
        <CardContent className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Ordered</p>
            <p className="mt-1">{formatDate(item.orderedDate) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Received</p>
            <p className="mt-1">{formatDate(item.receivedDate) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Created</p>
            <p className="mt-1">{formatDateTime(item.createdAt) || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase">Confirmed</p>
            <p className="mt-1">
              {item.confirmedAt ? formatDateTime(item.confirmedAt) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      {item.items && item.items.length > 0 && (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-medium">Stock items</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Settlement currency:</span>
                <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
                  {currency}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      Unit cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                      Total
                    </th>
                    {hasForeignLine && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Originally
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                      Supplier ref
                    </th>
                    {hasSerialLine && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Serial numbers
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {item.items.map((line) => {
                    const lineCurrency = line.currency || currency;
                    const isForeign =
                      line.originalCurrency && line.originalCurrency !== lineCurrency;
                    return (
                      <tr key={line.id} className="hover:bg-gray-50/50 align-top">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {line.stockVariantName}
                          {line.notes && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {line.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {line.stockVariantSku || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {Number(line.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money amount={Number(line.unitCost)} currency={lineCurrency} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          <Money amount={Number(line.totalCost)} currency={lineCurrency} />
                        </td>
                        {hasForeignLine && (
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {isForeign ? (
                              <div className="flex flex-col">
                                <Money
                                  amount={Number(line.originalUnitCost ?? 0)}
                                  currency={line.originalCurrency}
                                />
                                {line.rateUsed != null && line.rateUsed !== 1 && (
                                  <span className="text-[10px]">
                                    @{" "}
                                    {Number(line.rateUsed).toLocaleString(undefined, {
                                      maximumFractionDigits: 6,
                                    })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-500">
                          {line.batchNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {line.expiryDate || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {line.supplierBatchReference || "—"}
                        </td>
                        {hasSerialLine && (
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            <SerialNumbersViewer
                              serialNumbers={line.serialNumbers ?? []}
                              itemName={line.stockVariantName}
                              sku={line.stockVariantSku}
                            />
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
    </div>
  );
}
