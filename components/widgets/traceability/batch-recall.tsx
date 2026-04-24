"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  Search,
  Loader2,
  RotateCcw,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  BatchImpact,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
} from "@/types/traceability/type";
import {
  fetchBatchImpact,
  findBatchesByNumber,
  recallBatch,
  revertBatchRecall,
} from "@/lib/actions/traceability-actions";

type Mode = "recall" | "revert";

const PAGE_SIZE = 50;

export function BatchRecall() {
  const [query, setQuery] = useState("");
  const [batches, setBatches] = useState<StockBatchSummary[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [page, setPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const [dialog, setDialog] = useState<{
    batchNumber: string;
    mode: Mode;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [impact, setImpact] = useState<BatchImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactWindowDays, setImpactWindowDays] = useState<number | null>(90);

  const [isSearching, startSearch] = useTransition();
  const [isMutating, startMutation] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  // Dashboard-side permission gating isn't wired yet (PermissionsProvider
  // exists but no layout populates it), so checking hasPermission here would
  // hide the button for everyone. The backend enforces PERM_inventory:update
  // via @PreAuthorize — a user without the role will see the button but get
  // a 403 when they confirm. Swap this to a real check once the provider is
  // populated in (protected)/layout.tsx.

  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const load = (nextPage: number) => {
    startSearch(async () => {
      const res = await findBatchesByNumber(query, nextPage, PAGE_SIZE);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Search failed",
          description: res.message,
        });
        setBatches([]);
        setTotalMatches(0);
        setHasSearched(true);
        return;
      }
      setBatches(res.data?.items ?? []);
      setTotalMatches(res.data?.totalElements ?? 0);
      setPage(nextPage);
      setHasSearched(true);
    });
  };

  const search = () => load(0);

  const reset = () => {
    setQuery("");
    setBatches([]);
    setTotalMatches(0);
    setPage(0);
    setHasSearched(false);
  };

  // Fetch impact preview when the recall/revert dialog opens, or when the
  // user changes the window. Default 90 days — most recall scenarios care
  // about "who got this since it went bad", not all-time.
  useEffect(() => {
    if (!dialog) {
      setImpact(null);
      setReason("");
      setImpactWindowDays(90);
      return;
    }
    if (dialog.mode !== "recall") return;
    setImpactLoading(true);
    fetchBatchImpact(dialog.batchNumber, impactWindowDays)
      .then((res) => {
        if (res.responseType === "success") setImpact(res.data ?? null);
        else setImpact(null);
      })
      .finally(() => setImpactLoading(false));
  }, [dialog, impactWindowDays]);

  const confirmMutation = () => {
    if (!dialog) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description:
          dialog.mode === "recall"
            ? "Explain why this batch is being pulled — the audit trail needs it."
            : "Explain why this recall is being reverted.",
      });
      return;
    }

    startMutation(async () => {
      const res =
        dialog.mode === "recall"
          ? await recallBatch(dialog.batchNumber, trimmedReason)
          : await revertBatchRecall(dialog.batchNumber, trimmedReason);

      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title:
            dialog.mode === "recall"
              ? "Couldn't recall"
              : "Couldn't revert recall",
          description: res.message,
        });
        return;
      }
      toast({
        title: dialog.mode === "recall" ? "Batch recalled" : "Recall reverted",
        description: res.message,
      });
      setDialog(null);
      search();
      router.refresh();
    });
  };

  const recallableNumbers = Array.from(
    new Set(batches.filter((b) => b.status === "ACTIVE").map((b) => b.batchNumber)),
  );
  const revertableNumbers = Array.from(
    new Set(batches.filter((b) => b.status === "RECALLED").map((b) => b.batchNumber)),
  );

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" /> Batch recall
          </h3>
          <p className="text-xs text-muted-foreground">
            Find every batch by number across the business, then recall or
            revert. A recall marks matching batches as RECALLED so they&apos;re
            no longer available for consumption. Requires a written reason for
            audit.
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim() || isSearching) return;
            search();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Batch number (BTH_…) or batch id (UUID)"
              className="pl-9 font-mono"
              disabled={isSearching}
            />
            {query && !isSearching && (
              <button
                type="button"
                onClick={reset}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
          </Button>
        </form>

        {isSearching && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        )}

        {hasSearched && !isSearching && batches.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No batches matching &ldquo;{query}&rdquo; for this business.
          </p>
        )}

        {!isSearching && batches.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/60">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Batch
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Variant
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Location
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                      On hand
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                      Unit cost
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Expiry
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {batches.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2 font-mono text-xs">
                        <Link
                          href={`/stock-batches/${b.id}`}
                          className="hover:underline"
                        >
                          {b.batchNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        {b.stockVariantDisplayName || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Link
                          href={`/locations/${b.locationId}`}
                          className="font-mono text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {b.locationId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {Number(b.quantityOnHand ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {b.unitCost != null ? (
                          <Money
                            amount={Number(b.unitCost)}
                            currency={b.currency || DEFAULT_CURRENCY}
                          />
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
                        {b.status === "RECALLED" && b.recallReason && (
                          <div className="mt-1 text-xs text-muted-foreground italic">
                            &ldquo;{b.recallReason}&rdquo;
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 text-xs border-t">
                  <span className="text-muted-foreground">
                    Page {page + 1} of {totalPages} — {totalMatches.toLocaleString()} matches
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => canPrev && load(page - 1)}
                      disabled={!canPrev || isSearching}
                    >
                      <ChevronsLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => canNext && load(page + 1)}
                      disabled={!canNext || isSearching}
                    >
                      Next <ChevronsRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {recallableNumbers.map((bn) => (
                <Button
                  key={`recall-${bn}`}
                  variant="destructive"
                  size="sm"
                  onClick={() => setDialog({ batchNumber: bn, mode: "recall" })}
                  disabled={isMutating}
                >
                  <AlertTriangle className="h-4 w-4 mr-1.5" /> Recall {bn}
                </Button>
              ))}
              {revertableNumbers.map((bn) => (
                <Button
                  key={`revert-${bn}`}
                  variant="outline"
                  size="sm"
                  onClick={() => setDialog({ batchNumber: bn, mode: "revert" })}
                  disabled={isMutating}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Revert recall on{" "}
                  {bn}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>

      <Dialog
        open={!!dialog}
        onOpenChange={(o) => !o && !isMutating && setDialog(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "recall"
                ? `Recall batch ${dialog.batchNumber}?`
                : `Revert recall on ${dialog?.batchNumber}?`}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === "recall"
                ? "Every active occurrence of this batch number across the business will be marked RECALLED. FEFO consumption will skip it. The reason is recorded in the audit log and broadcast so downstream systems can react."
                : "This will return RECALLED batches back to ACTIVE. Use this only if the recall was a mistake — the action is audited."}
            </DialogDescription>
          </DialogHeader>

          {dialog?.mode === "recall" && (
            <div className="rounded-md bg-muted/40 p-3 text-sm space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-medium">Impact preview</div>
                <div className="flex gap-1 text-xs">
                  {([30, 90, 180, null] as Array<number | null>).map((d) => (
                    <button
                      key={String(d)}
                      type="button"
                      onClick={() => setImpactWindowDays(d)}
                      className={`px-2 py-0.5 rounded border ${
                        impactWindowDays === d
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {d === null ? "All" : `${d}d`}
                    </button>
                  ))}
                </div>
              </div>
              {impactLoading && (
                <>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </>
              )}
              {!impactLoading && impact && (
                <>
                  <div className="text-xs text-muted-foreground">
                    {impact.affectedBatchCount} batch row(s) —{" "}
                    <span className="font-medium text-foreground">
                      {Number(impact.totalOnHand).toLocaleString()}
                    </span>{" "}
                    on hand will be quarantined.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {Number(impact.totalConsumed).toLocaleString()}
                    </span>{" "}
                    unit(s) already left the batch via sales / transfers /
                    modifications — those remain historically attributed.
                  </div>
                  {impact.movementImpacts.length > 0 && (
                    <div className="text-xs pt-1 text-muted-foreground">
                      Movement types touched:{" "}
                      {Array.from(
                        new Set(impact.movementImpacts.map((m) => m.movementType)),
                      ).join(", ")}
                    </div>
                  )}
                </>
              )}
              {!impactLoading && !impact && (
                <div className="text-xs text-muted-foreground italic">
                  Couldn&apos;t load impact preview. You can still proceed.
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recall-reason">
              Reason <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                dialog?.mode === "recall"
                  ? "e.g. Supplier contamination alert #A-2456"
                  : "e.g. Recall was entered against the wrong batch number"
              }
              rows={3}
              disabled={isMutating}
              maxLength={2000}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Recorded in the audit log and broadcast on the Kafka event. Keep
              it specific — future investigators will thank you.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDialog(null)}
              disabled={isMutating}
            >
              Keep as-is
            </Button>
            <Button
              variant={dialog?.mode === "recall" ? "destructive" : "default"}
              onClick={confirmMutation}
              disabled={isMutating || !reason.trim()}
            >
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialog?.mode === "recall"
                ? "Recall across business"
                : "Revert recall"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
