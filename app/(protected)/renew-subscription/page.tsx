"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoice, payInvoice } from "@/lib/actions/invoice-actions";
import {
  getSubscriptionAddons,
  verifyPayment,
} from "@/lib/actions/subscriptions";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import { InvoiceSchema } from "@/types/invoice/schema";
import { useToast } from "@/hooks/use-toast";
import {
  InvoiceItem,
  useInvoiceCalculations,
} from "@/hooks/useInvoiceCalculation";
import { useDiscountValidation } from "@/hooks/useDiscountValidation";
import SubscriptionPlanCard from "@/components/subscription/subscriptionPlanCard";
import AdditionalServiceCard from "@/components/subscription/additionalServiceCard";
import InvoiceItemCard from "@/components/subscription/invoiceItemCard";
import DiscountCodeInput from "@/components/widgets/discountCodeInput";
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import { UUID } from "crypto";
import { SubscriptionAddons } from "@/types/subscription/type";
import BillingHistoryTable from "@/components/subscription/billingTable";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Receipt,
  Loader2,
  DollarSign,
  Layers,
  Puzzle,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type InvoiceFormData = z.infer<typeof InvoiceSchema>;

const InvoiceSubscriptionPage = () => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "INITIATING" | "PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addons, setAddons] = useState<SubscriptionAddons[]>([]);

  const queryParam = useSearchParams();
  const locationId = queryParam.get("location");

  const {
    activeSubscription,
    subscriptionData,
    isLoading: subscriptionLoading,
  } = useSubscriptionData(locationId);

  const {
    isValidatingDiscount,
    discountValid,
    validatedDiscountCode,
    validateDiscount,
    clearDiscount,
  } = useDiscountValidation();

  const discountType =
    (validatedDiscountCode?.discountType?.toLowerCase() as
      | "percentage"
      | "fixed") || "percentage";

  const {
    subtotal,
    subscriptionSubtotal,
    servicesSubtotal,
    discountAmount,
    total,
    subscriptionTotal,
    servicesTotal,
    itemBreakdown,
  } = useInvoiceCalculations(invoiceItems, discount, discountType);

  const { toast } = useToast();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      email: "",
      phone: "",
      locationSubscriptions: [],
      discountCode: "",
    },
  });

  // ── Fetch addons ────────────────────────────────────────────────────────────
  useEffect(() => {
    getSubscriptionAddons("", 1, 100)
      .then((data) => setAddons(data.content))
      .catch(() =>
        toast({
          variant: "destructive",
          title: "Failed to load addons",
          description: "Please refresh",
        }),
      );
  }, []);

  // ── Auto-add current subscription ──────────────────────────────────────────
  useEffect(() => {
    if (activeSubscription?.subscription && subscriptionData.length > 0) {
      const currentPlan = subscriptionData.find(
        (p) => p.id === activeSubscription.subscription.id,
      );
      if (currentPlan) {
        setSelectedPlanId(currentPlan.id);
        setInvoiceItems([
          {
            id: Date.now(),
            type: "subscription",
            itemId: currentPlan.id,
            name: currentPlan.packageName,
            unitPrice: currentPlan.amount,
            months: 12,
            totalPrice: currentPlan.amount * 12,
            isRenewal: true,
            actionType: "renew",
          },
        ]);
      }
    }
  }, [activeSubscription, subscriptionData]);

  // ── Discount code watcher ───────────────────────────────────────────────────
  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
  });
  useEffect(() => {
    const t = setTimeout(() => validateDiscount(discountCode || ""), 500);
    return () => clearTimeout(t);
  }, [discountCode, validateDiscount]);

  useEffect(() => {
    if (validatedDiscountCode && discountValid)
      setDiscount(validatedDiscountCode.discountValue);
    else setDiscount(0);
  }, [validatedDiscountCode, discountValid]);

  // ── Handlers (unchanged logic) ──────────────────────────────────────────────
  const getActionType = useCallback(
    (plan: any): "upgrade" | "downgrade" | "renew" | "switch" | "subscribe" => {
      if (!activeSubscription?.subscription) return "subscribe";
      const cur = activeSubscription.subscription;
      if (plan.id === cur.id) return "renew";
      if (plan.amount > cur.amount) return "upgrade";
      if (plan.amount < cur.amount) return "downgrade";
      return "switch";
    },
    [activeSubscription],
  );

  const handlePlanSelection = useCallback(
    (plan: any) => {
      const actionType = getActionType(plan);
      const isDiamond = plan.packageName?.toLowerCase().includes("diamond");
      let nonSub = invoiceItems.filter((i) => i.type !== "subscription");
      if (isDiamond) {
        const removedAddons = nonSub.filter((i) => i.type === "service");
        nonSub = nonSub.filter((i) => i.type !== "service");
        if (removedAddons.length > 0)
          toast({
            title: "Addons Removed",
            description: "Diamond plans don't support addons.",
          });
      }
      setSelectedPlanId(plan.id);
      setInvoiceItems([
        ...nonSub,
        {
          id: Date.now(),
          type: "subscription",
          itemId: plan.id,
          name: plan.packageName,
          unitPrice: plan.amount,
          months: 12,
          totalPrice: plan.amount * 12,
          actionType,
          isRenewal: actionType === "renew",
        },
      ]);
    },
    [invoiceItems, getActionType, toast],
  );

  const isDiamondSubscriptionSelected = useMemo(() => {
    const sel = invoiceItems.find((i) => i.type === "subscription");
    if (!sel) return false;
    return (
      subscriptionData
        .find((p) => p.id === sel.itemId)
        ?.packageName?.toLowerCase()
        .includes("diamond") || false
    );
  }, [invoiceItems, subscriptionData]);

  const addAdditionalService = useCallback(
    (service: any) => {
      if (isDiamondSubscriptionSelected) {
        toast({
          title: "Diamond Package",
          description: "Addons cannot be added to Diamond plans.",
          variant: "destructive",
        });
        return;
      }
      if (
        invoiceItems.find(
          (i) => i.type === "service" && i.itemId === service.id.toString(),
        )
      ) {
        toast({
          title: "Already Added",
          description: "This service is already in your invoice.",
          variant: "destructive",
        });
        return;
      }
      const months =
        invoiceItems.find((i) => i.type === "subscription")?.months ?? 12;
      setInvoiceItems((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "service",
          itemId: service.id.toString(),
          name: service.name,
          unitPrice: service.amount,
          months,
          totalPrice: service.amount * months,
        },
      ]);
      toast({
        title: "Service Added",
        description: `Added for ${months} month(s).`,
      });
    },
    [invoiceItems, toast, isDiamondSubscriptionSelected],
  );

  const removeInvoiceItem = useCallback(
    (id: number) => {
      if (invoiceItems.find((i) => i.id === id)?.type === "subscription")
        setSelectedPlanId(null);
      setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
    },
    [invoiceItems],
  );

  const updateItemMonths = useCallback((id: number, months: number) => {
    setInvoiceItems((prev) => {
      const updated = prev.map((i) =>
        i.id === id ? { ...i, months, totalPrice: i.unitPrice * months } : i,
      );
      const changedItem = updated.find((i) => i.id === id);
      if (changedItem?.type === "subscription") {
        return updated.map((i) =>
          i.type === "service"
            ? { ...i, months, totalPrice: i.unitPrice * months }
            : i,
        );
      }
      return updated;
    });
  }, []);

  const handlePendingPayment = useCallback(
    (transactionId: string, invoice: string) => {
      setTimeout(() => {
        let attempts = 0;
        const maxAttempts = 12;
        const start = Date.now();
        const interval = setInterval(async () => {
          attempts++;
          if (Date.now() - start > 300000) {
            clearInterval(interval);
            setPaymentStatus("FAILED");
            return;
          }
          try {
            const res = await verifyPayment(transactionId, invoice);
            setPaymentStatus(res.invoicePaymentStatus);
            if (res.invoicePaymentStatus === "SUCCESS") {
              clearInterval(interval);
              handleSuccessfulPayment(res);
            } else if (
              res.invoicePaymentStatus === "FAILED" ||
              attempts >= maxAttempts
            ) {
              clearInterval(interval);
              setPaymentStatus("FAILED");
            }
          } catch {
            clearInterval(interval);
            setPaymentStatus("FAILED");
          }
        }, 5000);
      }, 20000);
    },
    [],
  );

  const handleSuccessfulPayment = useCallback((_response: any) => {
    setTimeout(() => {
      setIsModalOpen(false);
      window.location.href = "/renew-subscription";
    }, 2000);
  }, []);

  const handleCreateInvoice = useCallback(
    async (data: InvoiceFormData) => {
      if (invoiceItems.length === 0) {
        form.setError("root", { message: "Please add at least one item" });
        return;
      }
      setIsLoading(true);
      setIsModalOpen(true);
      setPaymentStatus("INITIATING");
      try {
        const subs = invoiceItems.filter((i) => i.type === "subscription");
        const services = invoiceItems.filter((i) => i.type === "service");
        const hasAddons = services.length > 0;
        const hasValidDiscount =
          validatedDiscountCode?.discount && discountValid;
        const payload: any = {};

        if (subs.length > 0) {
          payload.locationSubscriptions = subs.map((item) => {
            const sub = subscriptionData.find((s: any) => s.id === item.itemId);
            if (!sub) throw new Error(`Subscription ${item.itemId} not found`);
            return {
              locationId,
              locationSubscriptionPackageId: sub.id,
              subscriptionDurationCount: item.months,
              attachSubscriptionAddon: hasAddons,
              subscriptionDurationType: "MONTHS",
              ...(hasValidDiscount && {
                locationSubscriptionDiscountId: validatedDiscountCode.discount,
              }),
            };
          });
          if (hasAddons)
            payload.locationAddons = services.map((i) => ({
              subscriptionAddon: i.itemId,
              ...(hasValidDiscount && { discountCode: data.discountCode }),
            }));
        } else if (hasAddons) {
          if (!activeSubscription?.subscription?.id)
            throw new Error(
              "Active subscription required for standalone addons",
            );
          payload.locationFreeStandingAddonSubscriptions = services.map(
            (i) => ({
              targetedLocationSubscriptionId: activeSubscription.id,
              subscriptionAddon: i.itemId,
              ...(hasValidDiscount && { discountCode: data.discountCode }),
            }),
          );
        }

        if (data.email) payload.email = data.email;
        if (data.phone) payload.phone = data.phone;
        if (hasValidDiscount) {
          payload.discountCode = data.discountCode;
          payload.globalDiscount = {
            discountId: validatedDiscountCode.discount,
            discountCode: data.discountCode,
            discountValue: validatedDiscountCode.discountValue,
            discountType: validatedDiscountCode.discountType,
          };
        }

        const response = await createInvoice(payload, locationId ?? undefined);
        if (response && "id" in response && data.email && data.phone) {
          setPaymentStatus("PENDING");
          const payment = await payInvoice(
            (response as { id: UUID }).id,
            data.email,
            data.phone,
          );
          setPaymentStatus("PROCESSING");
          handlePendingPayment(payment.id, payment.invoice);
        } else throw new Error("Missing data to initiate payment");
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
        setPaymentStatus("FAILED");
      } finally {
        setIsLoading(false);
      }
    },
    [
      invoiceItems,
      subscriptionData,
      form,
      handlePendingPayment,
      validatedDiscountCode,
      discountValid,
      toast,
      locationId,
      activeSubscription,
    ],
  );

  const onFormError = useCallback(
    (errors: any) => {
      const first = Object.values(errors)[0] as any;
      if (first?.message)
        toast({
          title: "Validation Error",
          description: first.message,
          variant: "destructive",
        });
    },
    [toast],
  );

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Totals section ──────────────────────────────────────────────────────────
  const TotalsSection = () => (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-gray-500">
        <span>Subtotal</span>
        <span className="text-gray-700 font-medium">
          TZS {subtotal.toLocaleString()}
        </span>
      </div>

      {discountAmount > 0 &&
        subscriptionSubtotal > 0 &&
        servicesSubtotal > 0 && (
          <>
            <div className="flex justify-between text-blue-600">
              <span>Subscription</span>
              <span>TZS {subscriptionTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Addons</span>
              <span>TZS {servicesTotal.toLocaleString()}</span>
            </div>
          </>
        )}

      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-600 font-medium">
          <span>Discount</span>
          <span>− TZS {discountAmount.toLocaleString()}</span>
        </div>
      )}

      <div className="h-px bg-gray-100" />
      <div className="flex justify-between font-bold text-base text-gray-900">
        <span>Total</span>
        <span>TZS {total.toLocaleString()}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 pb-12">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="pt-6">
        <div className="relative overflow-hidden ">
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Subscription & Billing
              </h1>
              <p className="text-sm text-black mt-1">
                Manage your plans, addons and payment history
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Plans + Addons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plans */}
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Subscription Plans
                </h2>
                <p className="text-xs text-gray-400">
                  Choose a plan that suits your needs
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subscriptionData.map((plan: any) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={selectedPlanId === plan.id}
                    isCurrent={activeSubscription?.subscription?.id === plan.id}
                    actionType={getActionType(plan)}
                    onSelect={handlePlanSelection}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Addons */}
          <section className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50">
                <Puzzle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Additional Services
                </h2>
                <p className="text-xs text-gray-400">
                  Enhance your plan with extra features
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addons.map((service) => (
                  <AdditionalServiceCard
                    key={service.id}
                    service={service}
                    isAdded={invoiceItems.some(
                      (i) =>
                        i.type === "service" &&
                        i.itemId === service.id.toString(),
                    )}
                    onAdd={addAdditionalService}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT: Payment summary */}
        <div>
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Summary header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50">
                <Receipt className="h-4 w-4 text-orange-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">
                Payment Summary
              </h2>
            </div>

            <div className="p-5">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateInvoice, onFormError)}
                  className="space-y-5"
                >
                  {/* Customer details */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Customer Details
                    </p>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-600">
                            Email <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="customer@example.com"
                              className="h-9 text-sm rounded-xl border-gray-200"
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
                            Phone <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PhoneInput
                              placeholder="Phone number"
                              {...field}
                              className="h-9 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Items */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Selected Items
                    </p>
                    {invoiceItems.length === 0 ? (
                      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-gray-200 py-6">
                        <ShieldCheck className="h-7 w-7 text-gray-300" />
                        <p className="text-xs text-gray-400">
                          No items selected yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {invoiceItems.map((item) => (
                          <InvoiceItemCard
                            key={item.id}
                            item={item}
                            onRemove={removeInvoiceItem}
                            onUpdateMonths={updateItemMonths}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {invoiceItems.length > 0 && (
                    <>
                      <div className="h-px bg-gray-100" />

                      {/* Discount */}
                      <DiscountCodeInput
                        control={form.control}
                        isValidating={isValidatingDiscount}
                        isValid={discountValid}
                        onClear={() => {
                          setDiscount(0);
                          clearDiscount();
                          form.setValue("discountCode", "");
                        }}
                      />

                      <div className="h-px bg-gray-100" />

                      {/* Totals */}
                      <TotalsSection />

                      {/* Pay button */}
                      <Button
                        type="submit"
                        disabled={isLoading || invoiceItems.length === 0}
                        className={cn(
                          "w-full h-10 rounded-xl font-semibold text-sm transition-all",
                          "bg-gray-900 hover:bg-gray-800 text-white",
                        )}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-1.5" />
                            Pay Now · TZS {total.toLocaleString()}
                          </>
                        )}
                      </Button>

                      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Secure payment via M-Pesa
                      </p>
                    </>
                  )}
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Billing history ───────────────────────────────────────────────────── */}
      <BillingHistoryTable locationId={locationId ?? undefined} />

      <PaymentStatusModal
        isOpen={isModalOpen}
        status={paymentStatus}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default InvoiceSubscriptionPage;
