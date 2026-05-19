"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Layers,
  Loader2,
  Puzzle,
  Receipt,
  ShieldCheck,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SubscriptionPlanCard from "@/components/subscription/subscriptionPlanCard";
import AdditionalServiceCard from "@/components/subscription/additionalServiceCard";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import { useToast } from "@/hooks/use-toast";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";

import {
  addItemAddon,
  changeItemPlan,
  getAddons,
  getCurrentSubscription,
  getPackages,
  getPendingInvoice,
} from "@/lib/actions/billing-actions";
import { initiatePayment } from "@/lib/actions/payment-actions";
import { cn } from "@/lib/utils";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidPhoneNumber } from "libphonenumber-js";

import type {
  Addon,
  BillingInvoice,
  Package,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";

interface StoreUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once payment for the upgrade succeeds — parent should retry createStore. */
  onResolved: () => void;
  locationId: string;
  businessId: string;
  /** Optional message lifted from the 409 (e.g. "Store limit reached for this location's subscription plan (0)..."). */
  triggerMessage?: string | null;
}

type Tab = "plan" | "addon";

const PaymentSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z
    .string({ required_error: "Phone is required" })
    .refine(isValidPhoneNumber, { message: "Enter a valid phone number" }),
});
type PaymentFormData = z.infer<typeof PaymentSchema>;

export default function StoreUpgradeDialog({
  open,
  onOpenChange,
  onResolved,
  locationId,
  businessId,
  triggerMessage,
}: StoreUpgradeDialogProps) {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [locationItem, setLocationItem] = useState<SubscriptionItem | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [isMutating, setIsMutating] = useState(false);

  const [pendingInvoice, setPendingInvoice] = useState<BillingInvoice | null>(null);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [hasResolved, setHasResolved] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { email: "", phone: "" },
  });

  const { status: paymentStatus, error: paymentError } =
    usePaymentPolling(paymentRefId);

  // ── Load subscription + catalog when dialog opens ─────────────────────
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);
    setPendingInvoice(null);
    setPaymentRefId(null);
    setHasResolved(false);
    form.reset();

    (async () => {
      try {
        const [sub, pkgs, adns] = await Promise.all([
          getCurrentSubscription(),
          getPackages("LOCATION"),
          getAddons(),
        ]);
        if (cancelled) return;

        setSubscription(sub);
        setPackages(pkgs);
        setAddons(adns);

        const item =
          sub?.items.find(
            (i) =>
              i.entityType === "LOCATION" &&
              i.entityId === locationId &&
              i.status === "ACTIVE",
          ) ?? null;
        setLocationItem(item);

        if (!sub || !item) {
          setLoadError(
            "We couldn't find an active subscription for this location. Please refresh or contact billing support.",
          );
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error
              ? e.message
              : "Failed to load subscription details.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, locationId, form]);

  // ── Watch payment status; fire onResolved on SUCCESS ──────────────────
  useEffect(() => {
    if (paymentStatus === "SUCCESS" && !hasResolved) {
      setHasResolved(true);
      toast({
        title: "Payment successful",
        description: "Creating your store...",
      });
      // Brief delay so the success modal frame paints before we tear down.
      const t = setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentRefId(null);
        onOpenChange(false);
        onResolved();
      }, 1200);
      return () => clearTimeout(t);
    }
    if (paymentStatus === "FAILED") {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: paymentError || "Please try again.",
      });
    }
  }, [paymentStatus, paymentError, hasResolved, toast, onOpenChange, onResolved]);

  // ── Derived ───────────────────────────────────────────────────────────
  const currentPackage = useMemo(
    () =>
      locationItem?.packageInfo
        ? packages.find((p) => p.id === locationItem.packageInfo!.id) ?? locationItem.packageInfo
        : null,
    [packages, locationItem],
  );

  /**
   * Strictly higher-tier LOCATION plans — this dialog only opens after a
   * store-limit 409, so downgrades / lateral moves don't unlock the action.
   * Sorted ascending by price so the cheapest upgrade that works appears
   * first.
   */
  const upgradePlans = useMemo(() => {
    if (!currentPackage) {
      return packages
        .slice()
        .sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
    }
    return packages
      .filter((p) => (p.basePrice ?? 0) > (currentPackage.basePrice ?? 0))
      .sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0));
  }, [packages, currentPackage]);

  /** LOCATION-scoped addons (paid store-slot lives here). */
  const locationAddons = useMemo(
    () => addons.filter((a) => (a as Addon & { entityType?: string }).entityType === "LOCATION"),
    [addons],
  );

  /** Has the user already added the addon to this item? */
  const isAddonAdded = useCallback(
    (addonId: string) =>
      !!locationItem?.addons.some((a) => a.id === addonId),
    [locationItem],
  );

  // ── Actions ───────────────────────────────────────────────────────────
  const refetchPendingInvoice = useCallback(
    async (subId: string) => {
      // The mutation creates the prorated invoice asynchronously in many
      // setups — give it a brief retry budget before giving up.
      for (let attempt = 0; attempt < 5; attempt++) {
        const invoice = await getPendingInvoice(subId);
        if (invoice) return invoice;
        await new Promise((r) => setTimeout(r, 600));
      }
      return null;
    },
    [],
  );

  const handlePickPlan = useCallback(
    async (plan: Package) => {
      if (!subscription || !locationItem || isMutating) return;
      if (plan.id === locationItem.packageInfo?.id) return;

      setIsMutating(true);
      try {
        await changeItemPlan(subscription.id, locationItem.id, plan.id);
        toast({
          title: "Plan changed",
          description: `Switched to ${plan.name}. Generating prorated invoice…`,
        });
        const invoice = await refetchPendingInvoice(subscription.id);
        if (!invoice) {
          toast({
            variant: "destructive",
            title: "Invoice not ready",
            description:
              "We changed your plan but couldn't fetch the invoice. Please refresh.",
          });
          return;
        }
        setPendingInvoice(invoice);

        // Refresh subscription so the UI reflects the new plan / addons.
        const refreshed = await getCurrentSubscription();
        setSubscription(refreshed);
        setLocationItem(
          refreshed?.items.find(
            (i) =>
              i.entityType === "LOCATION" &&
              i.entityId === locationId &&
              i.status === "ACTIVE",
          ) ?? null,
        );
      } catch (e: unknown) {
        toast({
          variant: "destructive",
          title: "Failed to change plan",
          description: e instanceof Error ? e.message : undefined,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [subscription, locationItem, isMutating, locationId, refetchPendingInvoice, toast],
  );

  const handlePickAddon = useCallback(
    async (addon: Addon) => {
      if (!subscription || !locationItem || isMutating) return;
      if (isAddonAdded(addon.id)) return;

      setIsMutating(true);
      try {
        await addItemAddon(subscription.id, locationItem.id, addon.id);
        toast({
          title: "Addon added",
          description: `${addon.name} added. Generating prorated invoice…`,
        });
        const invoice = await refetchPendingInvoice(subscription.id);
        if (!invoice) {
          toast({
            variant: "destructive",
            title: "Invoice not ready",
            description:
              "We added the slot but couldn't fetch the invoice. Please refresh.",
          });
          return;
        }
        setPendingInvoice(invoice);

        const refreshed = await getCurrentSubscription();
        setSubscription(refreshed);
        setLocationItem(
          refreshed?.items.find(
            (i) =>
              i.entityType === "LOCATION" &&
              i.entityId === locationId &&
              i.status === "ACTIVE",
          ) ?? null,
        );
      } catch (e: unknown) {
        toast({
          variant: "destructive",
          title: "Failed to add slot",
          description: e instanceof Error ? e.message : undefined,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [subscription, locationItem, isMutating, isAddonAdded, locationId, refetchPendingInvoice, toast],
  );

  const handlePay = useCallback(
    async (data: PaymentFormData) => {
      if (!pendingInvoice || !subscription) return;
      setIsPaymentSubmitting(true);
      setIsPaymentModalOpen(true);
      try {
        const payment = await initiatePayment({
          invoiceId: pendingInvoice.id,
          amount: pendingInvoice.totalAmount,
          currency: pendingInvoice.currency,
          businessId,
          locationId,
          customerPhone: data.phone,
          customerEmail: data.email,
          description: `Store-slot upgrade for invoice ${pendingInvoice.invoiceNumber}`,
        });
        setPaymentRefId(payment.externalReferenceId);
      } catch (e: unknown) {
        toast({
          variant: "destructive",
          title: "Payment failed",
          description: e instanceof Error ? e.message : undefined,
        });
        setIsPaymentModalOpen(false);
      } finally {
        setIsPaymentSubmitting(false);
      }
    },
    [pendingInvoice, subscription, businessId, locationId, toast],
  );

  const getActionType = useCallback(
    (
      plan: Package,
    ): "upgrade" | "downgrade" | "renew" | "switch" | "subscribe" => {
      if (!currentPackage) return "subscribe";
      if (plan.id === currentPackage.id) return "renew";
      if (plan.basePrice > currentPackage.basePrice) return "upgrade";
      if (plan.basePrice < currentPackage.basePrice) return "downgrade";
      return "switch";
    },
    [currentPackage],
  );

  // ── Render ────────────────────────────────────────────────────────────

  const showInvoiceSection = !!pendingInvoice;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          overlayClassName="bg-foreground/30 backdrop-blur-sm"
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-4 ring-amber-100/70">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">
                  Store limit reached
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-relaxed">
                  {triggerMessage ??
                    "This location's current subscription plan doesn't allow more stores. Upgrade the plan or add a paid store slot to continue."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading your subscription…</span>
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          ) : (
            <div className="space-y-4">
              {currentPackage && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Current Plan
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {currentPackage.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Included Stores
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {currentPackage.includedStoreCount ?? 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              {!showInvoiceSection && (
                <div className="flex gap-1.5 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("plan")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      activeTab === "plan"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Upgrade plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("addon")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      activeTab === "addon"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    <Puzzle className="h-3.5 w-3.5" />
                    Add paid slot
                  </button>
                </div>
              )}

              {/* Option grids — hidden once an invoice exists */}
              {!showInvoiceSection && activeTab === "plan" && (
                <section>
                  {upgradePlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                      No higher plans available for this location.
                      <br />
                      Try the &ldquo;Add paid slot&rdquo; option instead.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                      {isMutating && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                        </div>
                      )}
                      {upgradePlans.map((plan) => (
                        <SubscriptionPlanCard
                          key={plan.id}
                          plan={plan}
                          isSelected={false}
                          isCurrent={plan.id === currentPackage?.id}
                          actionType={getActionType(plan)}
                          onSelect={handlePickPlan}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {!showInvoiceSection && activeTab === "addon" && (
                <section>
                  {locationAddons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
                      No paid store-slot addons available. Try upgrading the
                      plan instead.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 relative">
                      {isMutating && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                        </div>
                      )}
                      {locationAddons.map((addon) => (
                        <AdditionalServiceCard
                          key={addon.id}
                          service={addon}
                          isAdded={isAddonAdded(addon.id)}
                          onAdd={handlePickAddon}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Invoice + payment */}
              {showInvoiceSection && pendingInvoice && (
                <section className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
                      <Receipt className="h-3.5 w-3.5 text-orange-500" />
                      <h3 className="text-xs font-semibold text-gray-900">
                        Prorated invoice
                      </h3>
                      <span className="ml-auto font-mono text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {pendingInvoice.invoiceNumber}
                      </span>
                    </div>
                    <div className="p-4 space-y-2.5 text-sm">
                      {pendingInvoice.lineItems.map((li) => (
                        <div key={li.id} className="flex justify-between">
                          <span className="text-gray-600">{li.description}</span>
                          <span className="text-gray-800">
                            {pendingInvoice.currency}{" "}
                            {li.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {pendingInvoice.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount</span>
                          <span>
                            - {pendingInvoice.currency}{" "}
                            {pendingInvoice.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-gray-100 my-1" />
                      <div className="flex justify-between font-bold text-base text-gray-900">
                        <span>Total due</span>
                        <span>
                          {pendingInvoice.currency}{" "}
                          {pendingInvoice.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handlePay)}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-gray-600">
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="you@example.com"
                                  className="h-9 text-sm rounded-xl"
                                  {...field}
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
                              <FormLabel className="text-xs text-gray-600">
                                Phone
                              </FormLabel>
                              <FormControl>
                                <PhoneInput
                                  placeholder="Phone number"
                                  className="h-9 text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPaymentSubmitting}
                          onClick={() => {
                            setPendingInvoice(null);
                          }}
                        >
                          Change option
                        </Button>
                        <Button
                          type="submit"
                          disabled={isPaymentSubmitting}
                          className={cn(
                            "flex-1 h-10 rounded-xl font-semibold text-sm",
                            "bg-gray-900 hover:bg-gray-800 text-white",
                          )}
                        >
                          {isPaymentSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Processing…
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-1.5" />
                              Pay {pendingInvoice.currency}{" "}
                              {pendingInvoice.totalAmount.toLocaleString()} &amp;
                              create store
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
                        <ShieldCheck className="h-3 w-3" />
                        Your store details are held safely and will be created
                        the moment payment confirms.
                      </p>
                    </form>
                  </Form>
                </section>
              )}

              {!showInvoiceSection && (
                <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
                  <CreditCard className="h-3 w-3" />
                  A prorated invoice is generated automatically when you pick an
                  option. Pay it and your store is created instantly.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentStatusModal
        isOpen={isPaymentModalOpen}
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
          setIsPaymentModalOpen(false);
          setPaymentRefId(null);
        }}
      />

      {/* Tiny success summary shown briefly inside the dialog before close */}
      {hasResolved && paymentStatus === "SUCCESS" && (
        <div className="sr-only" aria-live="polite">
          <CheckCircle2 className="h-3 w-3" /> Payment confirmed
        </div>
      )}
    </>
  );
}
