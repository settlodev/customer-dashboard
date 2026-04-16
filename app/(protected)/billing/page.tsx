"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import {
  getCurrentSubscription,
  prepaySubscription,
} from "@/lib/actions/billing-actions";
import { initiatePayment } from "@/lib/actions/payment-actions";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import BillingHistoryTable from "@/components/subscription/billingTable";
import { PrepaymentFormSchema } from "@/types/billing/schema";
import type { Subscription, SubscriptionItem } from "@/types/billing/types";
import { cn } from "@/lib/utils";
import {
  Loader2,
  DollarSign,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  Sparkles,
  Calendar,
} from "lucide-react";

type PrepayFormData = z.infer<typeof PrepaymentFormSchema>;

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentItem, setCurrentItem] = useState<SubscriptionItem | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { status: paymentStatus, error: paymentError } = usePaymentPolling(paymentRefId);

  const form = useForm<PrepayFormData>({
    resolver: zodResolver(PrepaymentFormSchema),
    defaultValues: { email: "", phone: "", monthsToPrepay: 12 },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sub = await getCurrentSubscription();
      setSubscription(sub);
      setCurrentItem(sub?.items.find((i) => i.status === "ACTIVE"));
    } catch {
      toast({ variant: "destructive", title: "Failed to load subscription data" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast({ title: "Payment successful", description: "Your subscription has been extended." });
      setTimeout(() => {
        setIsModalOpen(false);
        loadData();
      }, 2000);
    }
    if (paymentStatus === "FAILED") {
      toast({ variant: "destructive", title: "Payment failed", description: paymentError || "Please try again." });
    }
  }, [paymentStatus, paymentError, toast, loadData]);

  const handlePrepay = useCallback(
    async (data: PrepayFormData) => {
      if (!subscription) return;

      setIsSubmitting(true);
      setIsModalOpen(true);

      try {
        const prepayment = await prepaySubscription(subscription.id, data.monthsToPrepay);

        const payment = await initiatePayment({
          invoiceId: prepayment.invoiceId,
          amount: prepayment.amount,
          currency: subscription.currency,
          businessId: subscription.businessId,
          locationId: currentItem?.entityId || "",
          customerPhone: data.phone,
          customerEmail: data.email,
          description: `Subscription prepayment - ${data.monthsToPrepay} month(s)`,
        });

        setPaymentRefId(payment.externalReferenceId);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Payment failed", description: error?.message });
        setIsModalOpen(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [subscription, currentItem, toast],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const paidThrough = subscription?.paidThrough
    ? new Date(subscription.paidThrough).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6 pb-12 pt-6 mt-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your subscription and payments</p>
        </div>
        {paidThrough && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Paid through <span className="font-medium text-gray-700">{paidThrough}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Plan details + invoice history */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current plan */}
          {currentItem && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Plan</p>
                  <p className="text-lg font-bold text-gray-900">{currentItem.packageName}</p>
                </div>
              </div>

              {currentItem.addons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active Addons</p>
                  <div className="flex flex-wrap gap-2">
                    {currentItem.addons.map((addon) => (
                      <span
                        key={addon.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      >
                        {addon.addonName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {subscription && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="font-medium text-gray-800 capitalize">{subscription.status?.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Auto-renew</p>
                    <p className="font-medium text-gray-800">{subscription.autoRenew ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Billing cycle</p>
                    <p className="font-medium text-gray-800">
                      {new Date(subscription.billingCycleStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      {" — "}
                      {new Date(subscription.billingCycleEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Currency</p>
                    <p className="font-medium text-gray-800">{subscription.currency}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoice history */}
          {subscription && <BillingHistoryTable subscriptionId={subscription.id} />}
        </div>

        {/* RIGHT: Prepay form */}
        <div>
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <Calendar className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-900">Prepay Subscription</h2>
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4">
                Pay ahead to extend your subscription. 12+ months gets an automatic annual discount.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePrepay)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-600">Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="you@example.com" className="h-9 text-sm rounded-xl" />
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
                        <FormLabel className="text-xs text-gray-600">Phone</FormLabel>
                        <FormControl>
                          <PhoneInput placeholder="Phone number" {...field} className="h-9 text-sm" />
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
                        <FormLabel className="text-xs text-gray-600">Months</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            className="h-9 text-sm rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                        {(field.value ?? 0) >= 12 && (
                          <p className="flex items-center gap-1 text-xs text-emerald-600">
                            <Sparkles className="h-3 w-3" />
                            Annual discount applied
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting || !subscription}
                    className={cn(
                      "w-full h-10 rounded-xl font-semibold text-sm",
                      "bg-gray-900 hover:bg-gray-800 text-white",
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-1.5" />
                        Generate Invoice & Pay
                      </>
                    )}
                  </Button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure payment
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>

      <PaymentStatusModal
        isOpen={isModalOpen}
        status={
          paymentStatus === "ACCEPTED" ? "PENDING"
            : paymentStatus === "PROCESSING" ? "PROCESSING"
            : paymentStatus === "SUCCESS" ? "SUCCESS"
            : paymentStatus === "FAILED" ? "FAILED"
            : "INITIATING"
        }
        onClose={() => {
          setIsModalOpen(false);
          setPaymentRefId(null);
        }}
      />
    </div>
  );
}
