"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  StockBatchSummary,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
} from "@/types/traceability/type";
import {
  findBatchesByNumber,
  recallBatch,
} from "@/lib/actions/traceability-actions";

export function BatchRecall() {
  const [query, setQuery] = useState("");
  const [batches, setBatches] = useState<StockBatchSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  const [isSearching, startSearch] = useTransition();
  const [isRecalling, startRecall] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  const search = () => {
    startSearch(async () => {
      const res = await findBatchesByNumber(query);
      setBatches(res);
      setHasSearched(true);
    });
  };

  const doRecall = (batchNumber: string) => {
    startRecall(async () => {
      const res = await recallBatch(batchNumber);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't recall",
          description: res.message,
        });
        return;
      }
      toast({ title: "Batch recalled", description: res.message });
      setConfirmFor(null);
      // Re-run the search so the UI reflects the RECALLED state.
      search();
      router.refresh();
    });
  };

  const uniqueBatchNumbers = Array.from(new Set(batches.map((b) => b.batchNumber)));

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Batch recall
          </h3>
          <p className="text-xs text-muted-foreground">
            Find every batch by its batch number across all locations, then
            recall it. A recall marks the batch status as RECALLED so it&apos;s
            no longer available for consumption.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") search();
              }}
              placeholder="Batch number (BTH-XXXXX…)"
              className="pl-9 font-mono"
              disabled={isSearching}
            />
          </div>
          <Button onClick={search} disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
          </Button>
        </div>

        {hasSearched && batches.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground italic">
            No batches matching &ldquo;{query}&rdquo; at your visible locations.
          </p>
        )}

        {batches.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Variant</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">On hand</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Unit cost</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Expiry</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2 font-mono text-xs">{b.batchNumber}</td>
                      <td className="px-3 py-2">{b.stockVariantDisplayName || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {Number(b.quantityOnHand ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {b.unitCost != null ? (
                          <Money amount={Number(b.unitCost)} currency={b.currency || DEFAULT_CURRENCY} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {b.expiryDate
                          ? new Date(b.expiryDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_TONES[b.status]}`}
                        >
                          {BATCH_STATUS_LABELS[b.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {uniqueBatchNumbers.map((bn) => (
                <Button
                  key={bn}
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmFor(bn)}
                  disabled={isRecalling}
                >
                  <AlertTriangle className="h-4 w-4 mr-1.5" /> Recall {bn}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!confirmFor} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recall batch {confirmFor}?</DialogTitle>
            <DialogDescription>
              Every occurrence of this batch number across every location will
              be marked RECALLED. On-hand quantity stays on the books but FEFO
              consumption will skip it. This cannot be undone from the
              dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmFor(null)}
              disabled={isRecalling}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmFor && doRecall(confirmFor)}
              disabled={isRecalling}
            >
              {isRecalling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Recall across locations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
