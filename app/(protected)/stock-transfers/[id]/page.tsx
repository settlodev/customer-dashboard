import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import { Boxes, FileDown, Layers, DollarSign } from "lucide-react";
import { getStockTransfer } from "@/lib/actions/stock-transfer-actions";
import { getCurrentDestination } from "@/lib/actions/context";
import StockTransferForm from "@/components/forms/stock_transfer_form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TRANSFER_DOCUMENT_STATUSES,
  TRANSFER_STATUS_COLORS,
  getTransferStatusLabel,
} from "@/types/stock-transfer/type";
import { TransferShareButton } from "@/components/widgets/stock-transfer/share-dialog";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { Money } from "@/components/widgets/money";
import { StockTransferStatusActions } from "@/components/widgets/stock-transfer/status-actions";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ stockItem?: string }>;

export default async function StockTransferPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";

  if (!isNewItem) {
    const [item, destination] = await Promise.all([
      getStockTransfer(resolvedParams.id),
      getCurrentDestination(),
    ]);
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

    const pendingMappingCount = (item.items ?? []).filter(
      (line) => line.mappingStatus === "PENDING",
    ).length;
    const isDestinationViewer = destination?.id === item.destinationLocationId;

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
          subtitle={`${item.sourceLocationName} → ${item.destinationLocationName}`}
          actions={
            <span className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  TRANSFER_STATUS_COLORS[item.status] ??
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {getTransferStatusLabel(item, destination?.id ?? null)}
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                Source currency:{" "}
                <span className="rounded bg-canvas px-2 py-0.5 font-semibold text-ink">
                  {currency}
                </span>
              </span>
              {TRANSFER_DOCUMENT_STATUSES.includes(item.status) && (
                <>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/stock-transfers/${item.id}/print`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileDown className="mr-1.5 h-4 w-4" />
                      Delivery Note
                    </a>
                  </Button>
                  <TransferShareButton transfer={item} />
                </>
              )}
              <StockTransferStatusActions
                transfer={item}
                activeDestinationId={destination?.id ?? null}
              />
            </span>
          }
        />
        <PageBody>
          {item.status === "PENDING_MAPPING" && pendingMappingCount > 0 && (
            <div className="rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-900">
              {isDestinationViewer ? (
                <>
                  <span className="font-semibold">
                    {pendingMappingCount}{" "}
                    {pendingMappingCount === 1 ? "item isn't" : "items aren't"}{" "}
                    in this location&apos;s catalogue yet.
                  </span>{" "}
                  Use <span className="font-semibold">Map items</span> to link
                  each one to a stock item you already carry — or create it as a
                  new item — and the outstanding quantity will be booked into
                  your stock.
                </>
              ) : (
                <>
                  Waiting for{" "}
                  <span className="font-semibold">
                    {item.destinationLocationName ?? "the destination"}
                  </span>{" "}
                  to map {pendingMappingCount}{" "}
                  {pendingMappingCount === 1 ? "item" : "items"} into their own
                  catalogue before those quantities can be credited there.
                </>
              )}
            </div>
          )}
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
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <span className="inline-flex flex-wrap items-center gap-2">
                              {line.variantName}
                              {line.mappingStatus === "PENDING" && (
                                <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                  Awaiting mapping
                                </span>
                              )}
                              {line.mappingStatus === "AUTO_UNCONFIRMED" && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  Auto-matched
                                </span>
                              )}
                            </span>
                            {line.resolvedDestVariantName &&
                              line.resolvedDestVariantName !== line.variantName && (
                                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                  Matched to {line.resolvedDestVariantName}
                                  {line.mappingStatus === "AUTO_UNCONFIRMED" &&
                                    " — check this is the right item"}
                                </p>
                              )}
                          </td>
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
        <StockTransferForm prefillStockItem={(await searchParams).stockItem} />
      </PageBody>
    </PageShell>
  );
}
