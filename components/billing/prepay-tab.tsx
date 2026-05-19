"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarClock,
  DollarSign,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useToast } from "@/hooks/use-toast";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { prepaySubscription } from "@/lib/actions/billing-actions";
import { initiatePayment } from "@/lib/actions/payment-actions";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import { PrepaymentFormSchema } from "@/types/billing/schema";
import { CouponInput } from "./coupon-input";
import { formatBillingDate } from "./shared";
import type { Coupon, Subscription, SubscriptionItem } from "@/types/billing/types";

interface PrepayTabProps {
  subscription: Subscription;
  primaryItem: SubscriptionItem | undefined;
}

type PrepayFormData = z.infer<typeof PrepaymentFormSchema>;

export function PrepayTab({ subscription, primaryItem }: PrepayTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const { status: paymentStatus, error: paymentError } = usePaymentPolling(paymentRefId);

  const form = useForm<PrepayFormData>({
    resolver: zodResolver(PrepaymentFormSchema),
    defaultValues: { email: "", phone: "", monthsToPrepay: 12 },
  });

  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast({ title: "Payment successful", description: "Subscription extended." });
      setTimeout(() => {
        setModalOpen(false);
        router.refresh();
      }, 1500);
    }
    if (paymentStatus === "FAILED") {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: paymentError || "Please try again.",
      });
    }
  }, [paymentStatus, paymentError, toast, router]);

  const onSubmit = useCallback(
    async (data: PrepayFormData) => {
      setSubmitting(true);
      setModalOpen(true);
      try {
        const prepayment = await prepaySubscription(subscription.id, data.monthsToPrepay);
        const payment = await initiatePayment({
          invoiceId: prepayment.invoiceId,
          amount: prepayment.amount,
          currency: subscription.currency ?? "TZS",
          businessId: subscription.businessId,
          locationId: primaryItem?.entityId ?? "",
          customerPhone: data.phone,
          customerEmail: data.email,
          description: `Subscription prepayment — ${data.monthsToPrepay} month(s)${
            coupon ? ` (coupon ${coupon.code} validated)` : ""
          }`,
        });
        setPaymentRefId(payment.externalReferenceId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not start payment",
          description: (error as Error)?.message ?? "Please try again.",
        });
        setModalOpen(false);
      } finally {
        setSubmitting(false);
      }
    },
    [subscription, primaryItem, coupon, toast],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-line bg-card p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-canvas">
            <CalendarClock className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">Prepay your subscription</h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Pay ahead to extend access. 12+ months automatically applies our annual discount.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="you@example.com"
                        className="h-9 text-[13px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] text-muted-foreground">Phone</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Phone number"
                        {...field}
                        className="h-9 text-[13px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthsToPrepay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11.5px] text-muted-foreground">Duration</FormLabel>
                    <Select
                      value={String(field.value ?? 12)}
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue placeholder="Pick a duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12">1 year</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="1">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <CouponInput onCouponChange={setCoupon} disabled={submitting} />
              {coupon && (
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Coupon recorded. Reach out to support to attach it to your subscription before the next invoice.
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <DollarSign className="mr-1.5 h-4 w-4" />
                  Generate invoice & pay
                </>
              )}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Secure payment — your card or mobile money is processed by our payment provider.
            </p>
          </form>
        </Form>
      </div>

      <aside className="space-y-3">
        <div className="rounded-xl border border-line bg-card p-5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Current period
          </p>
          <p className="mt-2 text-[13px] text-ink">
            {formatBillingDate(subscription.billingCycleStart)} —{" "}
            {formatBillingDate(subscription.billingCycleEnd)}
          </p>
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Paid through
          </p>
          <p className="mt-1 text-base font-semibold text-ink">
            {formatBillingDate(subscription.paidThrough)}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Tips
          </p>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink-2">
            <li>• Prepayments cancel any open PENDING invoice and create a fresh one.</li>
            <li>• Mobile-money prompts arrive within seconds — keep this tab open.</li>
            <li>• Need to pay for many locations at once? Contact support.</li>
          </ul>
        </div>
      </aside>

      <PaymentStatusModal
        isOpen={modalOpen}
        status={
          paymentStatus === "ACCEPTED"
            ? "PENDING"
            : paymentStatus === "PROCESSING"
              ? "PROCESSING"
              : paymentStatus === "SUCCESS"
                ? "SUCCESS"
                : paymentStatus === "FAILED"
                  ? "FAILED"
                  : "INITIATING"
        }
        onClose={() => {
          setModalOpen(false);
          setPaymentRefId(null);
        }}
      />
    </div>
  );
}
