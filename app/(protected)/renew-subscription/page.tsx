"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Loader2, DollarSign, CreditCard } from "lucide-react";
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

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      email: "",
      phone: "",
      locationSubscriptions: [],
      discountCode: "",
    },
  });

  useEffect(() => {
    async function fetchSubscriptionAddon() {
      const q = "";
      const page = 1;
      const pageLimit = 100;

      try {
        const data = await getSubscriptionAddons(q, page, pageLimit);
        setAddons(data.content);
      } catch (error) {
        console.error("Failed to fetch subscription addons", error);
        toast({
          variant: "destructive",
          title: "Failed to load ",
          description: "Please try refreshing the page",
        });
      }
    }
    fetchSubscriptionAddon();
  }, []);

  // Auto-add current subscription on load
  useEffect(() => {
    if (activeSubscription?.subscription && subscriptionData.length > 0) {
      const currentPlan = subscriptionData.find(
        (plan) => plan.id === activeSubscription.subscription.id,
      );
      if (currentPlan) {
        setSelectedPlanId(currentPlan.id);
        const renewalItem: InvoiceItem = {
          id: Date.now(),
          type: "subscription",
          itemId: currentPlan.id,
          name: currentPlan.packageName,
          unitPrice: currentPlan.amount,
          months: 12,
          totalPrice: currentPlan.amount * 12,
          isRenewal: true,
          actionType: "renew",
        };
        setInvoiceItems([renewalItem]);
      }
    }
  }, [activeSubscription, subscriptionData]);

  // Watch discount code changes
  const discountCode = useWatch({
    control: form.control,
    name: "discountCode",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateDiscount(discountCode || "");
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [discountCode, validateDiscount]);

  useEffect(() => {
    if (validatedDiscountCode && discountValid) {
      setDiscount(validatedDiscountCode.discountValue);
    } else {
      setDiscount(0);
    }
  }, [validatedDiscountCode, discountValid]);

  const getActionType = useCallback(
    (plan: any): "upgrade" | "downgrade" | "renew" | "switch" | "subscribe" => {
      if (!activeSubscription?.subscription) return "subscribe";

      const currentPlan = activeSubscription.subscription;
      if (plan.id === currentPlan.id) return "renew";
      if (plan.amount > currentPlan.amount) return "upgrade";
      if (plan.amount < currentPlan.amount) return "downgrade";
      return "switch";
    },
    [activeSubscription],
  );

  const handlePlanSelection = useCallback(
    (plan: any) => {
      const actionType = getActionType(plan);
      const isDiamond = plan.packageName?.toLowerCase().includes("diamond");

      // Remove existing subscription items
      let nonSubscriptionItems = invoiceItems.filter(
        (item) => item.type !== "subscription",
      );

      // If selecting Diamond package, also remove all addon items
      if (isDiamond) {
        nonSubscriptionItems = nonSubscriptionItems.filter(
          (item) => item.type !== "service",
        );

        // Show toast if addons were removed
        const removedAddons = invoiceItems.filter(
          (item) => item.type === "service",
        );
        if (removedAddons.length > 0) {
          toast({
            title: "Addons Removed",
            description:
              "Addons have been removed as they cannot be used with Diamond packages.",
            variant: "default",
          });
        }
      }

      const subscriptionItem: InvoiceItem = {
        id: Date.now(),
        type: "subscription",
        itemId: plan.id,
        name: plan.packageName,
        unitPrice: plan.amount,
        months: 12,
        totalPrice: plan.amount * 12,
        actionType: actionType,
        isRenewal: actionType === "renew",
      };

      setSelectedPlanId(plan.id);
      setInvoiceItems([...nonSubscriptionItems, subscriptionItem]);
    },
    [invoiceItems, getActionType, toast],
  );

  const isDiamondSubscriptionSelected = useMemo(() => {
    const selectedSubscription = invoiceItems.find(
      (item) => item.type === "subscription",
    );
    if (!selectedSubscription) return false;

    const subscriptionPlan = subscriptionData.find(
      (plan) => plan.id === selectedSubscription.itemId,
    );
    return (
      subscriptionPlan?.packageName?.toLowerCase().includes("diamond") || false
    );
  }, [invoiceItems, subscriptionData]);

  const addAdditionalService = useCallback(
    (service: any) => {
      // Check if Diamond subscription is selected
      if (isDiamondSubscriptionSelected) {
        toast({
          title: "Diamond Package Restriction",
          description:
            "Addons cannot be added to Diamond packages. Please contact support for assistance.",
          variant: "destructive",
        });
        return;
      }

      // Check if there's an active subscription to determine duration
      const activeSubscriptionItem = invoiceItems.find(
        (item) => item.type === "subscription",
      );

      // Default to 12 months if no subscription found, otherwise use subscription months
      const defaultMonths = activeSubscriptionItem
        ? activeSubscriptionItem.months
        : 12;

      const existingService = invoiceItems.find(
        (item) =>
          item.type === "service" && item.itemId === service.id.toString(),
      );

      if (existingService) {
        toast({
          title: "Service Already Added",
          description: "This service is already in your invoice",
          variant: "destructive",
        });
        return;
      }

      const newItem: InvoiceItem = {
        id: Date.now(),
        type: "service",
        itemId: service.id.toString(),
        name: service.name,
        unitPrice: service.amount,
        months: defaultMonths,
        totalPrice: service.amount * defaultMonths,
      };

      setInvoiceItems((prev) => [...prev, newItem]);

      // Show toast indicating the duration
      toast({
        title: "Service Added",
        description: `Service added for ${defaultMonths} month${defaultMonths !== 1 ? "s" : ""}`,
        variant: "default",
      });
    },
    [invoiceItems, toast, isDiamondSubscriptionSelected],
  );

  const removeInvoiceItem = useCallback(
    (id: number) => {
      const item = invoiceItems.find((item) => item.id === id);
      if (item?.type === "subscription") {
        setSelectedPlanId(null);
      }
      setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
    },
    [invoiceItems],
  );

  const updateItemMonths = useCallback((id: number, months: number) => {
    setInvoiceItems((prev) => {
      const updatedItems = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              months: months,
              totalPrice: item.unitPrice * months,
            }
          : item,
      );

      // If updating a subscription, also update all services to match the same duration
      const updatedItem = updatedItems.find((item) => item.id === id);
      if (updatedItem?.type === "subscription") {
        return updatedItems.map((item) =>
          item.type === "service"
            ? {
                ...item,
                months: months,
                totalPrice: item.unitPrice * months,
              }
            : item,
        );
      }

      return updatedItems;
    });
  }, []);

  const handlePendingPayment = useCallback(
    (transactionId: string, invoice: string) => {
      // console.log("Payment verification started");

      setTimeout(() => {
        let attemptCount = 0;
        const maxAttempts = 12;
        const pollingInterval = 5000;
        const maxDuration = 300000;
        const startTime = Date.now();

        const verificationInterval = setInterval(async () => {
          attemptCount++;

          if (Date.now() - startTime > maxDuration) {
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
            toast({
              title: "Payment Timeout",
              description:
                "Payment verification timed out. Please check your payment status.",
              variant: "destructive",
            });
            return;
          }

          try {
            // console.log("Verification attempt:", attemptCount);
            const verificationResult = await verifyPayment(
              transactionId,
              invoice,
            );
            setPaymentStatus(verificationResult.invoicePaymentStatus);

            if (verificationResult.invoicePaymentStatus === "SUCCESS") {
              clearInterval(verificationInterval);
              handleSuccessfulPayment(verificationResult);
            } else if (
              verificationResult.invoicePaymentStatus === "PROCESSING"
            ) {
              setPaymentStatus("PROCESSING");
            } else if (verificationResult.invoicePaymentStatus === "FAILED") {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
              setTimeout(() => {
                setIsModalOpen(false);
              }, 2000);
            } else if (attemptCount >= maxAttempts) {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            clearInterval(verificationInterval);
            setPaymentStatus("FAILED");
          }
        }, pollingInterval);
      }, 20000);
    },
    [],
  );

  const handleCreateInvoice = useCallback(
    async (data: InvoiceFormData) => {
      if (invoiceItems.length === 0) {
        form.setError("root", {
          message: "Please add at least one item to the invoice",
        });
        return;
      }

      setIsLoading(true);
      setIsModalOpen(true);
      setPaymentStatus("INITIATING");

      try {
        // Separate subscription and service items
        const subscriptionItems = invoiceItems.filter(
          (item) => item.type === "subscription",
        );
        const serviceItems = invoiceItems.filter(
          (item) => item.type === "service",
        );

        // Check if there are any addon/service items
        const hasAddons = serviceItems.length > 0;
        const hasSubscriptions = subscriptionItems.length > 0;
        const hasValidDiscount =
          validatedDiscountCode?.discount && discountValid;

        // Initialize the invoice payload
        const invoicePayload: any = {};

        // Scenario 1: Has subscription items
        if (hasSubscriptions) {
          const locationSubscriptions = subscriptionItems.map((item) => {
            const subscription = subscriptionData.find(
              (sub: { id: string }) => sub.id === item.itemId,
            );

            if (!subscription) {
              throw new Error(`Subscription with ID ${item.itemId} not found`);
            }

            const subscriptionPayload = {
              locationId: locationId,
              locationSubscriptionPackageId: subscription.id,
              subscriptionDurationCount: item.months,
              attachSubscriptionAddon: hasAddons,
              subscriptionDurationType: "MONTHS",
              // Apply discount to subscription items
              ...(hasValidDiscount && {
                locationSubscriptionDiscountId: validatedDiscountCode.discount,
              }),
            };

            return subscriptionPayload;
          });

          invoicePayload.locationSubscriptions = locationSubscriptions;

          // If we have subscription + addons, include them as regular addons
          if (hasAddons) {
            invoicePayload.locationAddons = serviceItems.map((item) => ({
              subscriptionAddon: item.itemId,
              // If your backend supports addon-level discounts, include it here
              ...(hasValidDiscount && {
                discountCode: data.discountCode,
              }),
            }));
          }
        }
        // Scenario 2: Only addons (standalone addons)
        else if (hasAddons) {
          if (!activeSubscription?.subscription?.id) {
            throw new Error(
              "You need an active subscription to purchase standalone addons",
            );
          }

          invoicePayload.locationFreeStandingAddonSubscriptions =
            serviceItems.map((item) => ({
              targetedLocationSubscriptionId: activeSubscription.id,
              subscriptionAddon: item.itemId,
              // Apply discount to standalone addons
              ...(hasValidDiscount && {
                discountCode: data.discountCode,
              }),
            }));
        }

        // Add customer details
        if (data.email) {
          invoicePayload.email = data.email;
        }

        if (data.phone) {
          invoicePayload.phone = data.phone;
        }

        // Global discount application - this ensures discount is applied regardless of item type
        if (hasValidDiscount) {
          // Apply discount at invoice level if your backend supports it
          invoicePayload.discountCode = data.discountCode;
          invoicePayload.globalDiscount = {
            discountId: validatedDiscountCode.discount,
            discountCode: data.discountCode,
            discountValue: validatedDiscountCode.discountValue,
            discountType: validatedDiscountCode.discountType,
          };
        }

        const locationQueryParam = locationId ? locationId : undefined;
        const response = await createInvoice(
          invoicePayload,
          locationQueryParam,
        );

        if (
          response &&
          typeof response === "object" &&
          "id" in response &&
          data.email &&
          data.phone
        ) {
          const invoiceId = (response as { id: UUID }).id;

          try {
            // Update status to PENDING before making payment
            setPaymentStatus("PENDING");

            const paymentResponse = await payInvoice(
              invoiceId,
              data.email,
              data.phone,
            );
            setPaymentStatus("PROCESSING");
            handlePendingPayment(paymentResponse.id, paymentResponse.invoice);
          } catch (error) {
            console.error("Error making payment:", error);
            setPaymentStatus("FAILED");
          }
        } else {
          throw new Error("Missing data required to initiate payment");
        }
      } catch (error) {
        toast({
          title: "Error Creating Invoice",
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccessfulPayment = useCallback((response: any) => {
    setTimeout(() => {
      setIsModalOpen(false);
      window.location.href = `/renew-subscription`;
    }, 2000);
  }, []);

  const onFormError = useCallback(
    (errors: any) => {
      const firstError = Object.values(errors)[0] as any;
      if (firstError?.message) {
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  // Loading state
  if (subscriptionLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderTotalsSection = () => (
    <div className="space-y-2">
      {/* Original Subtotal */}
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span>TZS {subtotal.toLocaleString()}</span>
      </div>

      {/* Show item-by-item breakdown if there's a discount */}
      {discountAmount > 0 && (
        <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
          <h5 className="font-medium text-gray-700">Discount Breakdown:</h5>
          {itemBreakdown.map((breakdown, index) => (
            <div key={breakdown.item.id} className="space-y-1">
              <div className="flex justify-between text-gray-600">
                <span className="truncate">{breakdown.item.name}:</span>
                <span>TZS {breakdown.originalPrice.toLocaleString()}</span>
              </div>
              {breakdown.discountApplied > 0 && (
                <>
                  <div className="flex justify-between text-green-600 pl-2">
                    <span>- Discount:</span>
                    <span>
                      -TZS {breakdown.discountApplied.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium pl-2 border-b pb-1">
                    <span>Subtotal:</span>
                    <span>TZS {breakdown.finalPrice.toLocaleString()}</span>
                  </div>
                </>
              )}
              {index < itemBreakdown.length - 1 && (
                <hr className="border-gray-200" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show category totals if both types exist and there's a discount */}
      {discountAmount > 0 &&
        subscriptionSubtotal > 0 &&
        servicesSubtotal > 0 && (
          <>
            <div className="flex justify-between text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <span>Subscription Total:</span>
              <span>TZS {subscriptionTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
              <span>Addon Total:</span>
              <span>TZS {servicesTotal.toLocaleString()}</span>
            </div>
          </>
        )}

      {/* Total discount applied */}
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-red-600 font-medium">
          <span>Total Discount Applied:</span>
          <span>-TZS {discountAmount.toLocaleString()}</span>
        </div>
      )}

      {/* Final Total */}
      <div className="flex justify-between font-bold text-lg border-t pt-2">
        <span>Final Total:</span>
        <span>TZS {total.toLocaleString()}</span>
      </div>

      {/* Example calculation display for transparency */}
      {discountAmount > 0 && itemBreakdown.length > 1 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <span className="font-medium">Calculation: </span>
          {itemBreakdown.map((breakdown, index) => (
            <span key={breakdown.item.id}>
              ({breakdown.originalPrice.toLocaleString()}-
              {breakdown.discountApplied.toLocaleString()})
              {index < itemBreakdown.length - 1 ? " + " : " = "}
            </span>
          ))}
          <span className="font-medium">TZS {total.toLocaleString()}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      {/* Header Section */}
      <div className="mt-18">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 lg:p-6 border border-blue-200">
          <h1 className="text-lg lg:text-2xl font-bold text-gray-900 mb-2">
            Billing & Subscription Management
          </h1>
          <p className="text-sm lg:text-lg text-gray-600">
            Manage your subscriptions, view payment history, and handle billing
            operations.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Plans & Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Plans Section */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center text-sm lg:text-lg">
                <CreditCard className="mr-2" size={20} />
                Available Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptionData.map((plan: any) => {
                  const actionType = getActionType(plan);
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrent =
                    activeSubscription?.subscription?.id === plan.id;

                  return (
                    <SubscriptionPlanCard
                      key={plan.id}
                      plan={plan}
                      isSelected={isSelected}
                      isCurrent={isCurrent}
                      actionType={actionType}
                      onSelect={handlePlanSelection}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="text-sm lg:text-lg">
              <CardTitle>Additional Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addons.map((service) => {
                  const isAdded = invoiceItems.some(
                    (item) =>
                      item.type === "service" &&
                      item.itemId === service.id.toString(),
                  );

                  return (
                    <AdditionalServiceCard
                      key={service.id}
                      service={service}
                      isAdded={isAdded}
                      onAdd={addAdditionalService}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary Sidebar */}
        <div>
          <Card className="sticky top-6 border-t-4 border-t-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center text-sm lg:text-lg">
                <Receipt className="mr-2" size={20} />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateInvoice, onFormError)}
                  className="space-y-4"
                >
                  {/* Customer Details */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="customer@gmail.com"
                              required
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
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <PhoneInput
                              placeholder="Enter phone number"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Items</h4>
                    {invoiceItems.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        No items added yet
                      </p>
                    ) : (
                      <div className="space-y-3">
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
                      <Separator />

                      {/* Discount */}
                      <div className="space-y-3">
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
                      </div>

                      <Separator />

                      {renderTotalsSection()}

                      <Button
                        type="submit"
                        disabled={isLoading || invoiceItems.length === 0}
                        className="w-full"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Processing</span>
                          </div>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          <PaymentStatusModal
            isOpen={isModalOpen}
            status={paymentStatus}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </div>
      <BillingHistoryTable locationId={locationId ? locationId : undefined} />
    </div>
  );
};

export default InvoiceSubscriptionPage;
