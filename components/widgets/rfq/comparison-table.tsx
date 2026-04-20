"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Loader2, DollarSign, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { useToast } from "@/hooks/use-toast";
import type { QuoteComparison, Rfq, SupplierQuote } from "@/types/rfq/type";
import { canAwardRfq } from "@/types/rfq/type";
import { awardRfq } from "@/lib/actions/rfq-actions";

interface Props {
  rfq: Rfq;
  comparison: QuoteComparison | null;
  supplierMap: Record<string, string>;
}

export function QuoteComparisonTable({ rfq, comparison, supplierMap }: Props) {
  const currency = comparison?.currency || rfq.currency || DEFAULT_CURRENCY;
  const quotesById = new Map<string, SupplierQuote>(
    rfq.quotes.map((q) => [q.id, q]),
  );
  const awardable = canAwardRfq(rfq.status);

  const [awarding, setAwarding] = useState<string | null>(null);

  if (!comparison || comparison.items.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {rfq.quotes.length === 0
            ? "No quotes submitted yet."
            : "Comparison data isn't available for this RFQ state."}
        </CardContent>
      </Card>
    );
  }

  // Aggregate per-quote totals so buyers can award at quote level rather than
  // picking a winner per line (which the backend doesn't support anyway).
  const quoteTotals = new Map<string, { total: number; leadTime: number | null }>();
  comparison.items.forEach((row) => {
    row.offers.forEach((offer) => {
      const cur = quoteTotals.get(offer.supplierQuoteId) ?? { total: 0, leadTime: offer.leadTimeDays };
      cur.total += offer.totalPrice;
      cur.leadTime =
        cur.leadTime != null && offer.leadTimeDays != null
          ? Math.max(cur.leadTime, offer.leadTimeDays)
          : cur.leadTime ?? offer.leadTimeDays;
      quoteTotals.set(offer.supplierQuoteId, cur);
    });
  });

  const uniqueQuoteIds = Array.from(quoteTotals.keys());
  const cheapestQuoteId = uniqueQuoteIds.reduce<string | null>((best, id) => {
    const t = quoteTotals.get(id)!.total;
    if (best == null) return id;
    return t < quoteTotals.get(best)!.total ? id : best;
  }, null);
  const fastestQuoteId = uniqueQuoteIds.reduce<string | null>((best, id) => {
    const t = quoteTotals.get(id)!.leadTime;
    if (t == null) return best;
    if (best == null) return id;
    const currentBest = quoteTotals.get(best)!.leadTime;
    if (currentBest == null) return id;
    return t < currentBest ? id : best;
  }, null);

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Quote comparison</h3>
          <p className="text-xs text-muted-foreground">
            Per-line offers with cheapest / fastest highlighted.
            {awardable ? " Pick a winner to award." : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="border-b bg-gray-50/60">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Requested</th>
                {uniqueQuoteIds.map((quoteId) => {
                  const quote = quotesById.get(quoteId);
                  const supplierName = quote
                    ? supplierMap[quote.supplierId] ?? "Supplier"
                    : "—";
                  return (
                    <th
                      key={quoteId}
                      className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase min-w-[140px]"
                    >
                      {supplierName}
                      <div className="text-[10px] font-normal text-muted-foreground normal-case">
                        {quote?.leadTimeDays != null ? `${quote.leadTimeDays}d lead` : "—"}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y">
              {comparison.items.map((row) => (
                <tr key={row.rfqItemId}>
                  <td className="px-3 py-2 font-medium">
                    {row.stockVariantDisplayName || "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                    {Number(row.requestedQuantity).toLocaleString()}
                  </td>
                  {uniqueQuoteIds.map((quoteId) => {
                    const offer = row.offers.find(
                      (o) => o.supplierQuoteId === quoteId,
                    );
                    if (!offer) {
                      return (
                        <td
                          key={quoteId}
                          className="px-3 py-2 text-right text-xs text-muted-foreground"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={quoteId}
                        className={`px-3 py-2 text-right ${offer.isCheapest ? "bg-green-50/60" : ""}`}
                      >
                        <div className="flex flex-col items-end">
                          <Money amount={offer.quotedUnitPrice} currency={currency} />
                          <span className="text-[10px] text-muted-foreground">
                            ×{Number(offer.quotedQuantity).toLocaleString()} ={" "}
                            <Money amount={offer.totalPrice} currency={currency} />
                          </span>
                          <div className="flex gap-1 mt-0.5">
                            {offer.isCheapest && (
                              <span className="text-[9px] bg-green-100 text-green-700 rounded px-1">
                                cheapest
                              </span>
                            )}
                            {offer.isFastest && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 rounded px-1">
                                fastest
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/60 font-semibold">
                <td colSpan={2} className="px-3 py-2 text-right">Quote total</td>
                {uniqueQuoteIds.map((quoteId) => {
                  const totals = quoteTotals.get(quoteId)!;
                  const isCheapest = quoteId === cheapestQuoteId;
                  const isFastest = quoteId === fastestQuoteId;
                  return (
                    <td
                      key={quoteId}
                      className={`px-3 py-2 text-right ${isCheapest ? "bg-green-50" : ""}`}
                    >
                      <div className="flex flex-col items-end">
                        <Money amount={totals.total} currency={currency} />
                        <div className="flex gap-1 mt-1 text-[10px] text-muted-foreground">
                          {isCheapest && (
                            <span className="inline-flex items-center gap-0.5">
                              <DollarSign className="h-3 w-3" />
                              best price
                            </span>
                          )}
                          {isFastest && (
                            <span className="inline-flex items-center gap-0.5">
                              <Timer className="h-3 w-3" />
                              fastest
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {awardable && (
                <tr className="bg-white">
                  <td colSpan={2} />
                  {uniqueQuoteIds.map((quoteId) => (
                    <td key={quoteId} className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAwarding(quoteId)}
                      >
                        <Trophy className="h-3 w-3 mr-1" /> Award
                      </Button>
                    </td>
                  ))}
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </CardContent>

      <AwardDialog
        rfqId={rfq.id}
        awardingQuoteId={awarding}
        onClose={() => setAwarding(null)}
        supplierName={
          awarding
            ? supplierMap[quotesById.get(awarding)?.supplierId ?? ""] ?? "supplier"
            : ""
        }
      />
    </Card>
  );
}

function AwardDialog({
  rfqId,
  awardingQuoteId,
  onClose,
  supplierName,
}: {
  rfqId: string;
  awardingQuoteId: string | null;
  onClose: () => void;
  supplierName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const onConfirm = () => {
    if (!awardingQuoteId) return;
    startTransition(() => {
      awardRfq(rfqId, { supplierQuoteId: awardingQuoteId }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't award",
            description: res.message,
          });
          return;
        }
        toast({ title: "RFQ awarded", description: res.message });
        onClose();
        router.refresh();
      });
    });
  };

  return (
    <Dialog open={!!awardingQuoteId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Award to {supplierName}?</DialogTitle>
          <DialogDescription>
            This marks the winning quote and locks the RFQ. The awarded quote
            can then be converted into an LPO for receiving. Supplier pricing
            records are updated automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Award
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
