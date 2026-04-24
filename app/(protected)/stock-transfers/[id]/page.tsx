import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getStockTransfer } from "@/lib/actions/stock-transfer-actions";
import StockTransferForm from "@/components/forms/stock_transfer_form";
import { Card, CardContent } from "@/components/ui/card";
import { TRANSFER_STATUS_LABELS } from "@/types/stock-transfer/type";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import { StockTransferStatusActions } from "@/components/widgets/stock-transfer/status-actions";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";

type Params = Promise<{ id: string }>;

export default async function StockTransferPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    const item = await getStockTransfer(resolvedParams.id);
    if (!item) notFound();

    const currency = item.currency || DEFAULT_CURRENCY;
    const totalValue = (item.items ?? []).reduce(
      (sum, line) => sum + (line.unitCost ?? 0) * line.quantity,
      0,
    );

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
        <BreadcrumbsNav items={[
          { title: "Stock Transfers", link: "/stock-transfers" },
          { title: item.transferNumber, link: "" },
        ]} />
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{item.transferNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {item.sourceLocationName} &rarr; {item.destinationLocationName} — {TRANSFER_STATUS_LABELS[item.status] ?? item.status}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Source currency:</span>
              <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{currency}</span>
            </div>
            <StockTransferStatusActions transfer={item} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Items</p>
              <p className="text-2xl font-bold mt-1">{item.items?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Total Qty</p>
              <p className="text-2xl font-bold mt-1">
                {(item.items ?? []).reduce((sum, line) => sum + line.quantity, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Total Value</p>
              <p className="text-2xl font-bold mt-1">
                <Money amount={totalValue} currency={currency} />
              </p>
            </CardContent>
          </Card>
        </div>

        {item.items && item.items.length > 0 && (
          <Card>
            <CardContent className="px-2 sm:px-6 pt-6">
              <h3 className="text-lg font-medium mb-4">Transferred Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Qty Sent</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Qty Received</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Unit Cost</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {item.items.map((line) => {
                      const lineCurrency = line.currency || currency;
                      const lineTotal = (line.unitCost ?? 0) * line.quantity;
                      return (
                        <tr key={line.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{line.variantName}</td>
                          <td className="px-4 py-3 text-right">{line.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {line.receivedQuantity != null ? line.receivedQuantity.toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.unitCost != null ? (
                              <Money amount={line.unitCost} currency={lineCurrency} />
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {line.unitCost != null ? (
                              <Money amount={lineTotal} currency={lineCurrency} />
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <AttachmentsPanel
          entityType="STOCK_TRANSFER"
          entityId={item.id}
          description="Gate passes, carrier proofs, damage photos, signed receipts. Max 10 MB per file."
        />

        {item.notes && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Notes</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{item.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={[
            { title: "Stock Transfers", link: "/stock-transfers" },
            { title: "New", link: "" },
          ]} />
        </div>
        <h1 className="text-2xl font-bold">New Stock Transfer</h1>
        <p className="text-sm text-muted-foreground">Transfer stock between locations</p>
      </div>
      <StockTransferForm />
    </div>
  );
}
