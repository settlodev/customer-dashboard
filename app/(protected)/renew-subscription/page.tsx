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
  getPendingInvoice,
  getPackages,
  getAddons,
  changeItemPlan,
  addItemAddon,
  removeItemAddon,
  prepaySubscription,
} from "@/lib/actions/billing-actions";
import { initiatePayment } from "@/lib/actions/payment-actions";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import SubscriptionPlanCard from "@/components/subscription/subscriptionPlanCard";
import AdditionalServiceCard from "@/components/subscription/additionalServiceCard";
import type {
  Addon,
  BillingInvoice,
  Package,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";
import { cn } from "@/lib/utils";
import {
  Receipt,
  Loader2,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
} from "lucide-react";
import { isValidPhoneNumber } from "libphonenumber-js";

const PaymentSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string({ required_error: "Phone is required" }).refine(isValidPhoneNumber, { message: "Enter a valid phone number" }),
});

type PaymentFormData = z.infer<typeof PaymentSchema>;

export default function RenewSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentItem, setCurrentItem] = useState<SubscriptionItem | undefined>();
  const [pendingInvoice, setPendingInvoice] = useState<BillingInvoice | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { status: paymentStatus, error: paymentError } = usePaymentPolling(paymentRefId);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { email: "", phone: "" },
  });

  // ── Load data ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const sub = await getCurrentSubscription();
      setSubscription(sub);

      const active = sub?.items.find((i) => i.status === "ACTIVE");
      setCurrentItem(active);

      if (sub) {
        const invoice = await getPendingInvoice(sub.id);
        setPendingInvoice(invoice);
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to load subscription data" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load plan/addon options only when modifying
  useEffect(() => {
    if (!isModifying) return;
    Promise.all([getPackages(), getAddons()])
      .then(([pkgs, adns]) => {
        setPackages(pkgs);
        setAddons(adns);
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load plan options" }));
  }, [isModifying, toast]);

  // Handle payment completion
  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast({ title: "Payment successful", description: "Your subscription has been renewed." });
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.href = "/dashboard";
      }, 2000);
    }
    if (paymentStatus === "FAILED") {
      toast({ variant: "destructive", title: "Payment failed", description: paymentError || "Please try again." });
    }
  }, [paymentStatus, paymentError, toast]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleChangePlan = useCallback(
    async (plan: Package) => {
      if (!subscription || !currentItem || plan.id === currentItem.packageId) return;
      try {
        await changeItemPlan(subscription.id, currentItem.id, plan.id);
        toast({ title: "Plan updated", description: `Switched to ${plan.name}` });
        await loadData();
      } catch {
        toast({ variant: "destructive", title: "Failed to change plan" });
      }
    },
    [subscription, currentItem, loadData, toast],
  );

  const handleToggleAddon = useCallback(
    async (addon: Addon) => {
      if (!subscription || !currentItem) return;
      const has = currentItem.addons.some((a) => a.addonId === addon.id);
      try {
        if (has) {
          await removeItemAddon(subscription.id, currentItem.id, addon.id);
          toast({ title: "Addon removed", description: addon.name });
        } else {
          await addItemAddon(subscription.id, currentItem.id, addon.id);
          toast({ title: "Addon added", description: addon.name });
        }
        await loadData();
      } catch {
        toast({ variant: "destructive", title: `Failed to ${has ? "remove" : "add"} addon` });
      }
    },
    [subscription, currentItem, loadData, toast],
  );

  const handlePay = useCallback(
    async (data: PaymentFormData) => {
      if (!subscription || !pendingInvoice) {
        // No pending invoice — generate one via prepayment (1 month)
        if (!subscription) {
          toast({ variant: "destructive", title: "No subscription found" });
          return;
        }
        try {
          setIsSubmitting(true);
          const prepayment = await prepaySubscription(subscription.id, 1);
          setPendingInvoice(null); // will be replaced by new invoice
          setIsModalOpen(true);

          const payment = await initiatePayment({
            invoiceId: prepayment.invoiceId,
            amount: prepayment.amount,
            currency: subscription.currency,
            businessId: subscription.businessId,
            locationId: currentItem?.entityId || "",
            customerPhone: data.phone,
            customerEmail: data.email,
            description: "Subscription renewal - 1 month",
          });
          setPaymentRefId(payment.externalReferenceId);
        } catch (error: any) {
          toast({ variant: "destructive", title: "Failed to create invoice", description: error?.message });
          setIsModalOpen(false);
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      setIsSubmitting(true);
      setIsModalOpen(true);

      try {
        const payment = await initiatePayment({
          invoiceId: pendingInvoice.id,
          amount: pendingInvoice.totalAmount,
          currency: pendingInvoice.currency,
          businessId: subscription.businessId,
          locationId: currentItem?.entityId || "",
          customerPhone: data.phone,
          customerEmail: data.email,
          description: `Invoice ${pendingInvoice.invoiceNumber}`,
        });
        setPaymentRefId(payment.externalReferenceId);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Payment failed", description: error?.message });
        setIsModalOpen(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [subscription, pendingInvoice, currentItem, toast],
  );

  const getActionType = useCallback(
    (plan: Package): "upgrade" | "downgrade" | "renew" | "switch" | "subscribe" => {
      if (!currentItem) return "subscribe";
      if (plan.id === currentItem.packageId) return "renew";
      const currentPkg = packages.find((p) => p.id === currentItem.packageId);
      if (!currentPkg) return "switch";
      if (plan.basePrice > currentPkg.basePrice) return "upgrade";
      if (plan.basePrice < currentPkg.basePrice) return "downgrade";
      return "switch";
    },
    [currentItem, packages],
  );

  // ── Render ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Renew Your Subscription</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pay your outstanding invoice to restore access to your dashboard.
        </p>
      </div>

      {/* Current plan summary */}
      {currentItem && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Plan</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{currentItem.packageName}</p>
              {currentItem.addons.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentItem.addons.map((a) => a.addonName).join(", ")}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModifying(!isModifying)}
              className="text-xs"
            >
              {isModifying ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Change Plan
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Modify plan/addons (expandable) */}
      {isModifying && (
        <div className="space-y-4">
          {packages.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Available Plans</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={plan.id === currentItem?.packageId}
                    isCurrent={plan.id === currentItem?.packageId}
                    actionType={getActionType(plan)}
                    onSelect={handleChangePlan}
                  />
                ))}
              </div>
            </section>
          )}

          {addons.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
                <Puzzle className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-gray-900">Addons</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addons.map((addon) => (
                  <AdditionalServiceCard
                    key={addon.id}
                    service={addon}
                    isAdded={currentItem?.addons.some((a) => a.addonId === addon.id) ?? false}
                    onAdd={handleToggleAddon}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Invoice details */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <Receipt className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-900">
            {pendingInvoice ? "Outstanding Invoice" : "Generate Invoice"}
          </h2>
        </div>

        <div className="p-5 space-y-4">
          {pendingInvoice ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  {pendingInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Period</span>
                <span className="text-gray-700">
                  {new Date(pendingInvoice.periodStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  {" — "}
                  {new Date(pendingInvoice.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Line items */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                {pendingInvoice.lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="text-gray-800">{pendingInvoice.currency} {item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {pendingInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>- {pendingInvoice.currency} {pendingInvoice.discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="h-px bg-gray-100" />
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total Due</span>
                <span>{pendingInvoice.currency} {pendingInvoice.totalAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Due date</span>
                <span>
                  {new Date(pendingInvoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
              <p className="text-sm text-gray-600">
                No pending invoice found. A new invoice for 1 month will be generated when you pay.
              </p>
            </div>
          )}

          {/* Payment form */}
          <div className="border-t border-gray-100 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePay)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
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
                      {pendingInvoice
                        ? `Pay ${pendingInvoice.currency} ${pendingInvoice.totalAmount.toLocaleString()}`
                        : "Generate Invoice & Pay"}
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
