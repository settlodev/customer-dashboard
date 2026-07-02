"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Landmark, Loader2, Smartphone, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumericInput } from "@/components/ui/numeric-input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { recordLoanPayment } from "@/lib/actions/loans-actions";
import {
  LoanPaymentSchema,
  type LoanPaymentFormValues,
} from "@/types/loans/schema";
import { formatTzs, type Loan } from "@/types/loans/type";

interface PayMethod {
  key: LoanPaymentFormValues["channel"];
  name: string;
  detail: string;
  icon: typeof Smartphone;
}

const METHODS: PayMethod[] = [
  { key: "MPESA", name: "M-Pesa", detail: "··· 8317", icon: Smartphone },
  { key: "TIGO_PESA", name: "Tigo Pesa", detail: "··· 4502", icon: Smartphone },
  { key: "BANK", name: "Bank transfer", detail: "CRDB · ··· 1190", icon: Landmark },
];

export function MakePaymentDialog({
  loan,
  open,
  onOpenChange,
  onRecorded,
}: {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const nextAmount = loan.nextPaymentAmount ?? loan.installmentAmount;
  const chips: { key: string; label: string; value: number }[] = [
    { key: "next", label: "Next payment", value: nextAmount },
    {
      key: "double",
      label: "2 payments",
      value: Math.min(nextAmount * 2, loan.outstanding),
    },
    { key: "full", label: "Pay off", value: loan.outstanding },
  ];

  const [activeChip, setActiveChip] = useState<string | null>("next");

  const form = useForm<LoanPaymentFormValues>({
    resolver: zodResolver(LoanPaymentSchema),
    defaultValues: {
      amount: nextAmount,
      channel: loan.disbursementChannel,
      reference: "",
    },
  });

  const amount = form.watch("amount");
  const channel = form.watch("channel");

  const submit = (values: LoanPaymentFormValues) => {
    startTransition(async () => {
      const result = await recordLoanPayment(loan.id, values);
      if (result.responseType === "success") {
        toast({
          variant: "success",
          title: "Payment received",
          description: `${formatTzs(values.amount, loan.currencyCode)} toward ${loan.reference}.`,
        });
        form.reset();
        setActiveChip("next");
        onOpenChange(false);
        onRecorded?.();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Make a payment</DialogTitle>
          <DialogDescription>
            {loan.reference} · {loan.productName} ·{" "}
            {formatTzs(loan.outstanding, loan.currencyCode)} outstanding
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-2">
              Amount
            </label>
            <NumericInput
              value={amount}
              onChange={(v) => {
                form.setValue("amount", v ?? 0, { shouldValidate: true });
                setActiveChip(null);
              }}
              prefix={`${loan.currencyCode} `}
              placeholder="0"
              disabled={isPending}
            />
            {form.formState.errors.amount && (
              <p className="mt-1 text-xs text-neg">
                {form.formState.errors.amount.message}
              </p>
            )}
            <div className="mt-2.5 flex gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    form.setValue("amount", c.value, { shouldValidate: true });
                    setActiveChip(c.key);
                  }}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-2 text-[12.5px] font-semibold transition-colors",
                    activeChip === c.key
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-line-2 text-ink-2 hover:border-primary hover:text-primary-dark",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-2">
              Pay with
            </label>
            <div className="space-y-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const selected = channel === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      form.setValue("channel", m.key, { shouldValidate: true })
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary-light"
                        : "border-line-2 hover:border-line",
                    )}
                  >
                    <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-canvas text-ink-2">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-semibold text-ink">
                        {m.name}
                      </span>
                      <span className="block font-mono text-[11.5px] text-muted-foreground">
                        {m.detail}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-[1.5px]",
                        selected ? "border-primary" : "border-line-2",
                      )}
                    >
                      {selected && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loan.autoDeduct && (
            <div className="flex gap-2.5 rounded-xl bg-canvas p-3 text-[12.5px] leading-relaxed text-ink-3">
              <Zap className="h-4 w-4 flex-shrink-0 text-ink-2" />
              <div>
                Auto-deduction stays on. This is an{" "}
                <b className="font-semibold text-ink-2">extra payment</b> toward
                your balance — it shortens your term.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Pay {formatTzs(amount, loan.currencyCode)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
