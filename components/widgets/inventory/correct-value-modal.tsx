"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/widgets/money";
import { useToast } from "@/hooks/use-toast";
import { correctBatchValue } from "@/lib/actions/stock-value-correction-actions";

export interface CorrectValueModalProps {
  variantId: string;
  variantName: string;
  batchId: string;
  batchNumber: string;
  currentUnitCost: number;
  quantityOnHand: number;
  initialQuantity: number;
  currency?: string | null;
  /** Null when the batch's credit side can't be resolved — see the warning below. */
  creditSideHint?: string | null;
  sourceReferenceType?: "STOCK_INTAKE" | "OPENING_STOCK";
  sourceReferenceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CorrectValueModal({
  variantId,
  variantName,
  batchId,
  batchNumber,
  currentUnitCost,
  quantityOnHand,
  initialQuantity,
  currency,
  creditSideHint,
  sourceReferenceType,
  sourceReferenceId,
  open,
  onOpenChange,
}: CorrectValueModalProps) {
  const [newCost, setNewCost] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Anything no longer in the batch counts as consumed — including stock
  // transferred away. Floored, because an adjustment can push on-hand above
  // the original receipt.
  const consumed = Math.max(initialQuantity - quantityOnHand, 0);

  const preview = useMemo(() => {
    const parsed = Number(newCost);
    if (!newCost || Number.isNaN(parsed)) return null;
    const delta = parsed - currentUnitCost;
    return {
      delta,
      onHandDelta: delta * quantityOnHand,
      consumedDelta: delta * consumed,
      total: delta * (quantityOnHand + consumed),
    };
  }, [newCost, currentUnitCost, quantityOnHand, consumed]);

  const unchanged = preview !== null && preview.delta === 0;
  const canSubmit = preview !== null && !unchanged && reason.trim().length > 0 && !pending;

  const resetAndClose = () => {
    onOpenChange(false);
    setNewCost("");
    setReason("");
  };

  const submit = () => {
    startTransition(async () => {
      const result = await correctBatchValue({
        stockVariantId: variantId,
        batchId,
        newUnitCost: Number(newCost),
        currency: currency ?? undefined,
        reason: reason.trim(),
        sourceReferenceType,
        sourceReferenceId,
      });

      if (result?.responseType === "success") {
        toast({
          variant: "success",
          title: "Value corrected",
          description: `${batchNumber} is now costed at ${newCost}.`,
        });
        resetAndClose();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Could not correct the value",
          description: result?.message ?? "Please try again.",
        });
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) resetAndClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Correct recorded value</DialogTitle>
          <DialogDescription>
            {variantName} · batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 rounded-md border p-3 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Recorded cost</div>
            <Money amount={currentUnitCost} currency={currency} />
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Still on hand</div>
            <div>{quantityOnHand.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Already used</div>
            <div>{consumed.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newCost">Corrected unit cost</Label>
          <Input
            id="newCost"
            type="number"
            min="0"
            step="any"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            placeholder={String(currentUnitCost)}
            disabled={pending}
          />
          {unchanged && (
            <p className="text-destructive text-xs">
              That is the cost already recorded — nothing to correct.
            </p>
          )}
        </div>

        {preview && !unchanged && (
          <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span>Stock still on hand</span>
              <Money amount={preview.onHandDelta} currency={currency} />
            </div>
            <div className="flex justify-between">
              <span>Cost variance on stock already used</span>
              <Money amount={preview.consumedDelta} currency={currency} />
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <span>Total change</span>
              <Money amount={preview.total} currency={currency} />
            </div>
          </div>
        )}

        {!creditSideHint && (
          <p className="text-muted-foreground text-xs">
            This batch&apos;s original payment method couldn&apos;t be determined, so the
            difference will be posted against Accounts Payable. If it was paid in cash or
            by bank, adjust the entry in Accounting afterwards.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. supplier invoice showed 1,200 per unit, 1,000 was keyed"
            disabled={pending}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {pending ? "Correcting…" : "Correct value"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CorrectValueModal;
