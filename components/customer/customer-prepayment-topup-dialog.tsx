"use client";

import React, { useEffect, useState, useTransition } from "react";
import { UUID } from "node:crypto";
import { Loader2, Plus, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import { topUpCustomerPrepayment } from "@/lib/actions/customer-prepayments-actions";
import type { PaymentMethod } from "@/types/payments/type";

interface Props {
  customerId: UUID;
  locationId: UUID;
  currency?: string;
  /** Called after a successful top-up so the parent can refresh. */
  onSuccess?: () => void;
}

/**
 * Records a customer prepayment top-up. The instrument is created
 * PENDING_PAYMENT and activates once the Payment Service confirms the funding
 * payment (cash is instant; mobile money clears shortly after).
 */
export default function CustomerPrepaymentTopUpDialog({
  customerId,
  locationId,
  currency = "TZS",
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoaded, setMethodsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!open || methodsLoaded) return;
    let cancelled = false;
    fetchLocationPaymentMethods()
      .then((all) => {
        if (cancelled) return;
        // A top-up is real money in — exclude the prepaid tender itself and
        // non-cash bookkeeping methods (signed bill / complimentary).
        const fundable = all.filter(
          (m) =>
            m.enabled &&
            m.code !== "CUSTOMER_ACCOUNT" &&
            !m.signedBillEquivalent &&
            !m.complimentaryEquivalent,
        );
        setMethods(fundable);
        setMethodsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMethods([]);
        setMethodsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, methodsLoaded]);

  const reset = () => {
    setAmount(undefined);
    setPaymentMethodId("");
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!paymentMethodId) {
      setError("Choose how the customer is paying.");
      return;
    }

    startTransition(async () => {
      const result = await topUpCustomerPrepayment({
        customerId,
        locationId,
        amount,
        paymentMethodId: paymentMethodId as UUID,
        currency,
      });
      if (result.responseType === "success") {
        toast({
          title: "Top-up recorded",
          description: `${amount.toLocaleString()} ${currency} added to the customer's prepaid balance.`,
        });
        setOpen(false);
        reset();
        onSuccess?.();
      } else {
        setError(result.message ?? "Could not record the top-up");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Top up
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-3.5 w-3.5" />
            </span>
            Top up prepaid balance
          </DialogTitle>
          <DialogDescription className="text-xs">
            Record money the customer is paying in advance. They can spend it on
            future orders. It clears once the payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="topup-amount"
                className="text-xs font-medium text-muted-foreground"
              >
                AMOUNT ({currency})
              </Label>
              <NumericInput
                id="topup-amount"
                value={amount}
                onChange={setAmount}
                placeholder="0"
                decimalScale={2}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                PAID WITH
              </Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
                disabled={isPending || !methodsLoaded}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      methodsLoaded ? "Select a payment method" : "Loading…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {methodsLoaded && methods.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No fundable payment methods are enabled at this location.
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-3 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !amount || !paymentMethodId}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Recording…
                </>
              ) : (
                <>
                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                  Record top-up
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
