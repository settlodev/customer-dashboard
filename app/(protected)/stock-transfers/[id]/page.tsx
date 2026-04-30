import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Boxes, Layers, DollarSign } from "lucide-react";
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

    const totalQty = (item.items ?? []).reduce(
      (sum, line) => sum + line.quantity,
      0,
    );

    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Stock Transfers", href: "/stock-transfers" },
            { title: item.transferNumber },
          ]}
        />
        <PageHeader
          title={item.transferNumber}
          subtitle={`${item.sourceLocationName} → ${item.destinationLocationName} — ${TRANSFER_STATUS_LABELS[item.status] ?? item.status}`}
          actions={
            <span className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                Source currency:{" "}
                <span className="rounded bg-canvas px-2 py-0.5 font-semibold text-ink">
                  {currency}
                </span>
              </span>
              <StockTransferStatusActions transfer={item} />
            </span>
          }
        />
        <PageBody>
          <KpiStrip cols={3}>
            <KpiCard
              icon={<Layers className="h-3 w-3" />}
              label="Items"
              value={(item.items?.length ?? 0).toLocaleString()}
            />
            <KpiCard
              icon={<Boxes className="h-3 w-3" />}
              label="Total qty"
              value={totalQty.toLocaleString()}
            />
            <KpiCard
              icon={<DollarSign className="h-3 w-3" />}
              label="Total value"
              value={totalValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              unit={currency}
            />
          </KpiStrip>

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
        </PageBody>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Transfers", href: "/stock-transfers" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Stock Transfer"
        subtitle="Transfer stock between locations."
      />
      <PageBody>
        <StockTransferForm />
      </PageBody>
    </PageShell>
  );
}
