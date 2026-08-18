"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarClock, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import {
  getPendingInvoice,
  prepaySubscription,
} from "@/lib/actions/billing-actions";
import { InvoiceViewDialog } from "./invoice-view-dialog";
import { CouponInput, type CouponInputHandle } from "./coupon-input";
import { formatBillingDate } from "./shared";
import type {
  Coupon,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";

const PrepaymentSchema = z.object({
  monthsToPrepay: z
    .number({ required_error: "Duration is required" })
    .min(1, "Minimum 1 month")
    .max(24, "Maximum 24 months"),
});

type PrepayFormData = z.infer<typeof PrepaymentSchema>;

interface PrepayTabProps {
  subscription: Subscription;
  primaryItem: SubscriptionItem | undefined;
  contactDefaults?: { email: string; phone: string };
}

export function PrepayTab({
  subscription,
  primaryItem,
  contactDefaults,
}: PrepayTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const couponInputRef = useRef<CouponInputHandle>(null);

  const form = useForm<PrepayFormData>({
    resolver: zodResolver(PrepaymentSchema),
    defaultValues: { monthsToPrepay: 12 },
  });

  const onSubmit = useCallback(
    async (data: PrepayFormData) => {
      setSubmitting(true);
      try {
        // If a coupon code was typed but the user never clicked "Apply",
        // validate it now. Abort the whole flow on a bad code so we don't
        // generate an invoice the merchant didn't expect.
        const couponResolution = await couponInputRef.current?.resolve();
        if (couponResolution?.status === "invalid") {
          toast({
            variant: "destructive",
            title: "Coupon couldn't be applied",
            description: couponResolution.message,
          });
          return;
        }
        const appliedCoupon =
          couponResolution?.status === "ready" ? couponResolution.coupon : coupon;

        // Try to generate a fresh prepayment invoice. If the period already
        // has a pending invoice (409), recover the existing one instead so
        // the merchant can pay it directly.
        let invoiceId: string;
        try {
          const invoice = await prepaySubscription(
            subscription.id,
            data.monthsToPrepay,
            appliedCoupon?.code,
          );
          invoiceId = invoice.id;
        } catch (prepayError) {
          const err = prepayError as { status?: number; message?: string };
          const isConflict =
            err.status === 409 ||
            (err.message ?? "")
              .toLowerCase()
              .includes("invoice already exists");
          if (!isConflict) throw prepayError;

          const pending = await getPendingInvoice(subscription.id);
          if (!pending) throw prepayError;

          invoiceId = pending.id;
          toast({
            title: "Opening existing invoice",
            description: `An invoice for this period is already pending — continuing with that one.`,
          });
        }

        setOpenInvoiceId(invoiceId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Could not generate invoice",
          description: (error as Error)?.message ?? "Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [subscription, toast, coupon],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-line bg-card p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-canvas">
            <CalendarClock className="h-4 w-4 text-primary" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">
              Prepay your subscription
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Pay ahead to extend access. 12+ months automatically applies our
              annual discount.
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monthsToPrepay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11.5px] text-muted-foreground">
                    Duration
                  </FormLabel>
                  <Select
                    value={String(field.value ?? 12)}
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
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

            <div>
              <CouponInput
                ref={couponInputRef}
                onCouponChange={setCoupon}
                disabled={submitting}
              />
              {coupon && (
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Coupon {coupon.code} will apply to this invoice.
                </p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating invoice…
                </>
              ) : (
                <>
                  <FileText className="mr-1.5 h-4 w-4" />
                  Generate invoice &amp; pay
                </>
              )}
            </Button>

            <p className="text-center text-[11.5px] text-muted-foreground">
              You&apos;ll review the invoice before paying. Cancel or settle from
              the next screen.
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
            <li>
              • Generating opens an invoice — pay or cancel it from the next
              screen.
            </li>
            <li>
              • Mobile-money prompts arrive within seconds — keep this tab open.
            </li>
            <li>• Need to pay for many locations at once? Contact support.</li>
          </ul>
        </div>
      </aside>

      <InvoiceViewDialog
        open={openInvoiceId !== null}
        onOpenChange={(open) => !open && setOpenInvoiceId(null)}
        invoiceId={openInvoiceId}
        businessId={subscription.businessId}
        locationId={primaryItem?.entityId}
        defaultEmail={contactDefaults?.email}
        defaultPhone={contactDefaults?.phone}
        onPaid={() => {
          setOpenInvoiceId(null);
          router.refresh();
        }}
        onCancelled={() => {
          setOpenInvoiceId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
