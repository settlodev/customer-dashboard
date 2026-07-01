"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NumericFormat } from "react-number-format";
import { Check, Loader2, ThumbsDown, ThumbsUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { decideLoanApplication } from "@/lib/actions/admin/loans";
import type { LoanApplicationResponse } from "@/types/admin/loans";

interface DecisionPanelProps {
  application: LoanApplicationResponse;
  currency: string;
}

export function LoanApplicationDecisionPanel({
  application,
  currency,
}: DecisionPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<number | "">(
    application.requestedAmount,
  );
  const [approvedTermDays, setApprovedTermDays] = useState<number | "">(
    application.requestedTermDays,
  );
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const reset = () => {
    setMode(null);
    setError("");
    setApprovedAmount(application.requestedAmount);
    setApprovedTermDays(application.requestedTermDays);
    setNotes("");
    setRejectionReason("");
  };

  const submit = (approve: boolean) => {
    setError("");
    startTransition(async () => {
      const res = await decideLoanApplication(application.id, {
        approve,
        approvedAmount:
          approve && approvedAmount !== "" ? approvedAmount : undefined,
        approvedTermDays:
          approve && approvedTermDays !== "" ? approvedTermDays : undefined,
        notes: notes.trim() || undefined,
        rejectionReason: approve ? undefined : rejectionReason.trim(),
      });
      if (res.responseType === "error") {
        setError(res.message);
        return;
      }
      toast({
        title: approve ? "Application approved" : "Application declined",
        description: res.message,
      });
      router.refresh();
    });
  };

  const approveDisabled =
    isPending ||
    approvedAmount === "" ||
    Number(approvedAmount) <= 0 ||
    approvedTermDays === "" ||
    Number(approvedTermDays) <= 0;

  return (
    <section className="rounded-xl border border-line bg-card">
      <header className="border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Decision</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Approve with final terms, or decline with a reason. This is recorded
          against your staff account.
        </p>
      </header>

      <div className="p-5">
        {/* Mode picker */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("approve");
              setError("");
            }}
            disabled={isPending}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              mode === "approve"
                ? "border-pos bg-pos/10 text-pos"
                : "border-line bg-card text-ink-2 hover:border-pos/50 hover:text-pos",
            )}
          >
            <ThumbsUp className="h-4 w-4" /> Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("decline");
              setError("");
            }}
            disabled={isPending}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              mode === "decline"
                ? "border-neg bg-neg/10 text-neg"
                : "border-line bg-card text-ink-2 hover:border-neg/50 hover:text-neg",
            )}
          >
            <ThumbsDown className="h-4 w-4" /> Decline
          </button>
        </div>

        {/* Approve form */}
        {mode === "approve" ? (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="approved-amount" className="text-xs">
                  Approved amount
                </Label>
                <div className="flex items-stretch overflow-hidden rounded-md border border-line-2 focus-within:border-primary">
                  <span className="grid place-items-center border-r border-line bg-surface px-2.5 font-mono text-[11px] text-muted-foreground">
                    {currency}
                  </span>
                  <NumericFormat
                    id="approved-amount"
                    customInput={Input}
                    thousandSeparator=","
                    allowNegative={false}
                    decimalScale={2}
                    className="border-0 focus-visible:ring-0"
                    value={approvedAmount}
                    onValueChange={(v) =>
                      setApprovedAmount(v.value === "" ? "" : (v.floatValue ?? ""))
                    }
                    disabled={isPending}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Requested {application.requestedAmount.toLocaleString()}{" "}
                  {currency}.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="approved-term" className="text-xs">
                  Approved term (days)
                </Label>
                <NumericFormat
                  id="approved-term"
                  customInput={Input}
                  allowNegative={false}
                  decimalScale={0}
                  value={approvedTermDays}
                  onValueChange={(v) =>
                    setApprovedTermDays(v.value === "" ? "" : (v.floatValue ?? ""))
                  }
                  disabled={isPending}
                />
                <p className="text-[11px] text-muted-foreground">
                  Requested {application.requestedTermDays} days.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approve-notes" className="text-xs">
                Notes (optional)
              </Label>
              <Textarea
                id="approve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes on this approval."
                rows={2}
                maxLength={2000}
                disabled={isPending}
              />
            </div>
            {error ? <FormError message={error} /> : null}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => submit(true)}
                disabled={approveDisabled}
                className="bg-pos hover:bg-pos/90"
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm approval
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {/* Decline form */}
        {mode === "decline" ? (
          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="decline-reason" className="text-xs">
                Reason for decline <span className="text-primary">*</span>
              </Label>
              <Textarea
                id="decline-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Shared with the applicant."
                rows={3}
                maxLength={2000}
                disabled={isPending}
              />
            </div>
            {error ? <FormError message={error} /> : null}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => submit(false)}
                disabled={isPending || rejectionReason.trim().length === 0}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm decline
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
