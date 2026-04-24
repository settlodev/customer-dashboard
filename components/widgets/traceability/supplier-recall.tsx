"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  fetchBatchesBySupplier,
  recallBySupplier,
} from "@/lib/actions/traceability-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { Supplier } from "@/types/supplier/type";
import { StockBatchSummary } from "@/types/traceability/type";

function toIsoStart(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
}

function toIsoEnd(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
}

/**
 * Supplier-wide recall. Pick a supplier, optionally narrow by received-date
 * window, preview what would be hit, then recall everything that matches.
 * Intended for quality-alert scenarios where a whole supplier's shipment
 * needs to be pulled in one action.
 */
export function SupplierRecall() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  const [supplierId, setSupplierId] = useState<string>("");
  const [receivedAfter, setReceivedAfter] = useState<string>("");
  const [receivedBefore, setReceivedBefore] = useState<string>("");

  const [preview, setPreview] = useState<StockBatchSummary[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [hasPreview, setHasPreview] = useState(false);
  const [isPreviewing, startPreview] = useTransition();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isRecalling, startRecall] = useTransition();

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAllSuppliers()
      .then((list) => setSuppliers(list ?? []))
      .finally(() => setSuppliersLoading(false));
  }, []);

  const runPreview = () => {
    if (!supplierId) {
      toast({
        variant: "destructive",
        title: "Pick a supplier",
        description: "Select a supplier before previewing.",
      });
      return;
    }
    startPreview(async () => {
      const res = await fetchBatchesBySupplier(
        supplierId,
        toIsoStart(receivedAfter),
        toIsoEnd(receivedBefore),
        0,
        50,
      );
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Preview failed",
          description: res.message,
        });
        setPreview([]);
        setPreviewTotal(0);
        setHasPreview(true);
        return;
      }
      setPreview(res.data?.items ?? []);
      setPreviewTotal(res.data?.totalElements ?? 0);
      setHasPreview(true);
    });
  };

  const doRecall = () => {
    if (!reason.trim()) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Explain why this supplier's stock is being pulled.",
      });
      return;
    }
    startRecall(async () => {
      const res = await recallBySupplier(
        supplierId,
        reason.trim(),
        toIsoStart(receivedAfter),
        toIsoEnd(receivedBefore),
      );
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't recall",
          description: res.message,
        });
        return;
      }
      toast({ title: "Supplier recall complete", description: res.message });
      setConfirmOpen(false);
      setReason("");
      setPreview([]);
      setPreviewTotal(0);
      setHasPreview(false);
      router.refresh();
    });
  };

  const activeCount = preview.filter((b) => b.status === "ACTIVE").length;
  const supplierName =
    suppliers.find((s) => s.id === supplierId)?.name ?? "this supplier";

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Supplier-wide recall
          </h3>
          <p className="text-xs text-muted-foreground">
            Recall every ACTIVE batch sourced from a supplier, optionally
            bounded by received date. Use when a quality alert affects a whole
            shipment or date range. Preview first — the server caps each
            request at 500 batches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="sup-recall-supplier" className="text-xs">
              Supplier <span className="text-red-600">*</span>
            </Label>
            {suppliersLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="sup-recall-supplier">
                  <SelectValue placeholder="Pick a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="sup-after" className="text-xs">
              Received after
            </Label>
            <Input
              id="sup-after"
              type="date"
              value={receivedAfter}
              onChange={(e) => setReceivedAfter(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sup-before" className="text-xs">
              Received before
            </Label>
            <Input
              id="sup-before"
              type="date"
              value={receivedBefore}
              onChange={(e) => setReceivedBefore(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runPreview}
            disabled={isPreviewing || !supplierId}
          >
            {isPreviewing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Preview matches
          </Button>
          {(hasPreview || preview.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreview([]);
                setPreviewTotal(0);
                setHasPreview(false);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {hasPreview && !isPreviewing && (
          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="font-medium">
              {previewTotal} batch row{previewTotal === 1 ? "" : "s"} match —{" "}
              {activeCount} are ACTIVE and would be recalled
            </div>
            {preview.length > 0 && (
              <ul className="text-xs text-muted-foreground max-h-40 overflow-y-auto divide-y">
                {preview.slice(0, 10).map((b) => (
                  <li key={b.id} className="py-1 flex justify-between gap-2">
                    <span className="font-mono truncate">{b.batchNumber}</span>
                    <span>{b.stockVariantDisplayName}</span>
                    <span>
                      {b.status} · {Number(b.quantityOnHand).toLocaleString()}
                    </span>
                  </li>
                ))}
                {preview.length > 10 && (
                  <li className="py-1 italic">
                    …and {previewTotal - preview.length} more.
                  </li>
                )}
              </ul>
            )}
            {previewTotal > 500 && (
              <p className="text-xs text-amber-700">
                More than 500 matches — narrow the date window before
                recalling, the server will refuse to process more in one go.
              </p>
            )}
            {activeCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Recall {activeCount} batch{activeCount === 1 ? "" : "es"}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => !isRecalling && setConfirmOpen(o)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recall all batches from {supplierName}?</DialogTitle>
            <DialogDescription>
              Every ACTIVE batch matching the preview will be marked RECALLED,
              have its on-hand quantity quarantined, and any attached serials
              flipped to RECALLED. This action is audited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="sup-recall-reason">
              Reason <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="sup-recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Supplier contamination alert #A-2456 — all lots received in Jan"
              rows={3}
              disabled={isRecalling}
              maxLength={2000}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Recorded in the audit log for every affected batch.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={isRecalling}
            >
              Keep as-is
            </Button>
            <Button
              variant="destructive"
              onClick={doRecall}
              disabled={isRecalling || !reason.trim()}
            >
              {isRecalling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Recall across business
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
