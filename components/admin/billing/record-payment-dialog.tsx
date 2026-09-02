"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/lib/uploads/use-upload";

import {
  getPaymentProofPresignUrl,
  recordManualPayment,
} from "@/lib/actions/admin/billing";
import { InvoiceResponse, PaymentMethod } from "@/types/admin/billing";

interface RecordPaymentDialogProps {
  businessId: string;
  invoice: InvoiceResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "MOBILE_MONEY", label: "Mobile money" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHECK", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const ACCEPTED_FILE_TYPES = "image/*,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

export function RecordPaymentDialog({
  businessId,
  invoice,
  open,
  onOpenChange,
  onRecorded,
}: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const { upload, progress, isUploading } = useUpload();
  const [isRecording, setIsRecording] = useState(false);
  // Drives every disabled state below: busy while the proof uploads or records.
  const isPending = isUploading || isRecording;
  // Outstanding balance defaults to the full total for invoices from before
  // paidAmount/unpaidAmount existed on the response.
  const outstanding = invoice.unpaidAmount ?? invoice.totalAmount;
  const isTopUp = invoice.status === "PARTIALLY_PAID";
  const isOverdue =
    !!invoice.dueDate && new Date(invoice.dueDate) < new Date();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    "MOBILE_MONEY",
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState<string>(String(outstanding));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPaymentMethod("MOBILE_MONEY");
      setReferenceNumber("");
      setAmount(String(outstanding));
      setNotes("");
      setFile(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setAmount(String(outstanding));
    }
  }, [open, outstanding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!paymentMethod) {
      setError("Choose a payment method");
      return;
    }
    if (!referenceNumber.trim()) {
      setError("Reference number is required");
      return;
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Enter a positive amount");
      return;
    }
    if (amountNum > outstanding) {
      setError(
        `Amount exceeds the outstanding balance of ${outstanding.toLocaleString()}`,
      );
      return;
    }
    if (!file) {
      setError("Attach proof of payment (image or PDF)");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Proof file must be 10MB or smaller");
      return;
    }

    try {
      // 1. Upload the proof straight to object storage via a presigned URL —
      //    the bytes never pass through the Next.js server (no body limit).
      const uploaded = await upload({
        file,
        presign: (meta) => getPaymentProofPresignUrl(invoice.id, meta),
      });

      // 2. Record the payment, referencing the proof by its storage key.
      setIsRecording(true);
      const result = await recordManualPayment(businessId, invoice.id, {
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        amount: amountNum,
        notes: notes.trim() || undefined,
        proofKey: uploaded.key,
      });
      setIsRecording(false);

      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      const approved = result.data?.status === "APPROVED";
      // Amount is already capped at `outstanding` by validation above, so
      // reaching it (not just exceeding) means this payment clears the balance.
      const clearsBalance = amountNum >= outstanding;
      const remaining = Math.max(outstanding - amountNum, 0);
      toast({
        title: !approved
          ? "Payment recorded — pending approval"
          : clearsBalance
            ? "Payment recorded"
            : "Partial payment recorded",
        description: !approved
          ? `Waiting on a billing approver to finalize invoice ${invoice.invoiceNumber}.`
          : clearsBalance
            ? `Invoice ${invoice.invoiceNumber} marked paid.`
            : `Invoice ${invoice.invoiceNumber} is now partially paid — ${remaining.toLocaleString()} still outstanding.`,
      });
      onRecorded();
      onOpenChange(false);
    } catch (err) {
      setIsRecording(false);
      setError(err instanceof Error ? err.message : "Failed to upload proof");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isTopUp ? "Record top-up payment" : "Record manual payment"}
          </DialogTitle>
          <DialogDescription>
            {isTopUp
              ? `Invoice ${invoice.invoiceNumber} is partially paid. `
              : ""}
            If you hold billing approval and the amount clears the
            outstanding balance, this marks invoice {invoice.invoiceNumber}{" "}
            as paid and activates the subscription immediately. A smaller
            amount is recorded as a partial payment instead — you (or another
            approver) can record another payment later to finish it off.
            Otherwise it&apos;s recorded pending approval. Proof of payment
            (receipt or screenshot) is required either way.
          </DialogDescription>
        </DialogHeader>

        {isOverdue && (
          <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              This invoice was due{" "}
              {new Date(invoice.dueDate as string).toLocaleDateString()} and
              has passed its due date. Only a system admin can record a
              payment against it now.
            </span>
          </div>
        )}

        {error && <FormError message={error} />}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="payment-method" className="text-xs">
              Payment method
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              disabled={isPending}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Choose a method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference-number" className="text-xs">
              Reference number
            </Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction ID, M-Pesa code, cheque number…"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              min={0.01}
              max={outstanding}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
            />
            <p className="font-mono text-[10.5px] text-muted-foreground">
              {isTopUp
                ? `Invoice total: ${invoice.totalAmount.toLocaleString()} · Outstanding: ${outstanding.toLocaleString()}`
                : `Invoice total: ${invoice.totalAmount.toLocaleString()}`}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proof" className="text-xs">
              Proof of payment (image or PDF, max 10MB)
            </Label>
            <Input
              id="proof"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isPending}
            />
            {file && (
              <p className="font-mono text-[10.5px] text-muted-foreground">
                {file.name} · {Math.round(file.size / 1024)} KB
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-notes" className="text-xs">
              Notes (optional)
            </Label>
            <Textarea
              id="payment-notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading{progress ? ` ${progress.percent}%` : "…"}
                </span>
              ) : isRecording ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording…
                </span>
              ) : (
                "Record payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
