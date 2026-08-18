"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    "MOBILE_MONEY",
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amount, setAmount] = useState<string>(String(invoice.totalAmount));
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPaymentMethod("MOBILE_MONEY");
      setReferenceNumber("");
      setAmount(String(invoice.totalAmount));
      setNotes("");
      setFile(null);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setAmount(String(invoice.totalAmount));
    }
  }, [open, invoice.totalAmount]);

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
      toast({
        title: "Payment recorded",
        description: `Invoice ${invoice.invoiceNumber} marked paid.`,
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
          <DialogTitle>Record manual payment</DialogTitle>
          <DialogDescription>
            Marks invoice {invoice.invoiceNumber} as paid and activates the
            subscription. Proof of payment (receipt or screenshot) is required.
          </DialogDescription>
        </DialogHeader>

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
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
            />
            <p className="font-mono text-[10.5px] text-muted-foreground">
              Invoice total: {invoice.totalAmount.toLocaleString()}
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
