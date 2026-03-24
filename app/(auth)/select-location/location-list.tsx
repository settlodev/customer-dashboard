"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  MapPin,
  Loader2Icon,
  ChevronRight,
  PlusIcon,
  Warehouse,
} from "lucide-react";
import { Location } from "@/types/location/type";
import { refreshLocation, clearBusiness } from "@/lib/actions/business/refresh";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import WareHouseRegisterForm from "@/components/forms/warehouse/register_form";
import { refreshWarehouse } from "@/lib/actions/warehouse/current-warehouse-action";
import WarehouseSubscriptionModal from "@/components/widgets/warehouse/warehouse-subscription-modal";
import { UUID } from "crypto";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
import { createInvoice, payInvoice } from "@/lib/actions/invoice-actions";
import { verifyPayment } from "@/lib/actions/subscriptions";

const LocationList = ({
  locations,
  businessName,
  warehouses,
}: {
  locations: Location[];
  businessName: string;
  warehouses: any[];
}) => {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [locationType, setLocationType] = useState<"all" | "warehouse">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "INITIATING" | "PENDING" | "PROCESSING" | "FAILED" | "SUCCESS" | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();

  const displayedItems = useMemo(() => {
    return locationType === "warehouse" ? warehouses : locations;
  }, [locations, warehouses, locationType]);

  const getSubscriptionState = (
    subscriptionStatus: string | null | undefined,
  ) => {
    switch (subscriptionStatus) {
      case "EXPIRED":
      case "EXPIRED_TRIAL":
      case "DUE":
      case "PAST_DUE":
      case null:
      case undefined:
      case "":
        return "inactive";
      default:
        return "active";
    }
  };

  const handlePendingPayment = useCallback(
    (transactionId: string, invoice: string) => {
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
              description: "Payment verification timed out. Please check your payment status.",
              variant: "destructive",
            });
            return;
          }

          try {
            const verificationResult = await verifyPayment(transactionId, invoice);
            setPaymentStatus(verificationResult.invoicePaymentStatus);

            if (verificationResult.invoicePaymentStatus === "SUCCESS") {
              clearInterval(verificationInterval);
              handleSuccessfulPayment(verificationResult);
            } else if (verificationResult.invoicePaymentStatus === "PROCESSING") {
              setPaymentStatus("PROCESSING");
            } else if (verificationResult.invoicePaymentStatus === "FAILED") {
              clearInterval(verificationInterval);
              setPaymentStatus("FAILED");
              setTimeout(() => setIsModalOpen(false), 2000);
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
    [toast],
  );

  const handleWarehouseSubscription = async (
    packageId: string,
    email: string,
    phone: string,
    numberOfMonths: number,
  ) => {
    try {
      setIsModalOpen(true);
      setPaymentStatus("INITIATING");

      const invoicePayload = {
        warehouseSubscriptions: [
          {
            warehouseId: selectedWarehouse.id,
            subscriptionDurationType: "MONTHS",
            subscriptionDurationCount: numberOfMonths,
            warehouseSubscriptionPackageId: packageId,
          },
        ],
        email,
        phone,
      };

      const response = await createInvoice(invoicePayload);

      if (response && typeof response === "object" && "id" in response) {
        const invoiceId = (response as { id: UUID }).id;

        try {
          setPaymentStatus("PENDING");
          const paymentResponse = await payInvoice(invoiceId, email, phone);
          setPaymentStatus("PROCESSING");
          handlePendingPayment(paymentResponse.id, paymentResponse.invoice);
        } catch (error) {
          console.error("Error paying invoice:", error);
          setPaymentStatus("FAILED");
          setTimeout(() => setIsModalOpen(false), 3000);
        }
      }

      setShowSubscriptionModal(false);
      setSelectedWarehouse(null);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      setPaymentStatus("FAILED");
      setTimeout(() => setIsModalOpen(false), 3000);

      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "There was an error processing your subscription. Please try again.",
      });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSuccessfulPayment = useCallback(
    (_response: any) => {
      toast({
        title: "Subscription Successful",
        description: "Your warehouse subscription has been activated.",
      });

      setTimeout(async () => {
        setIsModalOpen(false);
        setIsRedirecting(true);
        await refreshWarehouse(selectedWarehouse);
        window.location.href = "/warehouse";
      }, 2000);
    },
    [selectedWarehouse, toast],
  );

  const handleLocationSelect = async (item: any, index: number) => {
    if (isRedirecting || pendingIndex !== null) return;
    setPendingIndex(index);

    const isWarehouse = locationType === "warehouse";
    const isInactive = getSubscriptionState(item.subscriptionStatus) === "inactive";

    if (isWarehouse) {
      if (isInactive) {
        setSelectedWarehouse(item);
        setShowSubscriptionModal(true);
        setPendingIndex(null);
        return;
      }
      setIsRedirecting(true);
      await refreshWarehouse(item);
      window.location.href = "/warehouse";
    } else {
      if (isInactive) {
        toast({
          variant: "destructive",
          title: "Subscription Expired",
          description: "Please renew your subscription to continue.",
        });
        setIsRedirecting(true);
        await refreshLocation(item);
        window.location.href = `/renew-subscription?location=${item.id}`;
      } else {
        setIsRedirecting(true);
        await refreshLocation(item);
        window.location.href = "/dashboard";
      }
    }

    setPendingIndex(null);
  };

  const handleSuccessfulCreation = () => {
    setIsRedirecting(true);
    toast({
      title: "Warehouse Created",
      description: "Your warehouse has been created successfully.",
    });
    setTimeout(() => {
      window.location.href = "/select-location";
    }, 1500);
  };

  const getStatusBadge = (item: any) => {
    const isInactive = getSubscriptionState(item.subscriptionStatus) === "inactive";
    if (!isInactive) return null;

    const isWarehouse = locationType === "warehouse";
    return (
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
          isWarehouse
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        )}
      >
        {isWarehouse ? "Unsubscribed" : "Expired"}
      </span>
    );
  };

  return (
    <section className="relative">
      {showCreateModal && (
        <WareHouseRegisterForm
          setShowCreateModal={setShowCreateModal}
          onSuccess={handleSuccessfulCreation}
        />
      )}

      {showSubscriptionModal && selectedWarehouse && (
        <WarehouseSubscriptionModal
          warehouse={selectedWarehouse}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedWarehouse(null);
          }}
          onSubscribe={handleWarehouseSubscription}
        />
      )}

      <div className="relative w-full max-w-md mx-auto">
        {isRedirecting && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm z-30 rounded-xl flex items-center justify-center flex-col gap-3">
            <Loader2Icon className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-primary font-medium">Redirecting...</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {businessName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a {locationType === "warehouse" ? "warehouse" : "location"} to continue
          </p>
        </div>

        {/* Toggle */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
          <button
            onClick={() => setLocationType("all")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              locationType === "all"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700",
            )}
          >
            <MapPin className="w-4 h-4" />
            Locations
          </button>
          <button
            onClick={() => setLocationType("warehouse")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              locationType === "warehouse"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700",
            )}
          >
            <Warehouse className="w-4 h-4" />
            Warehouses
          </button>
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                {locationType === "warehouse" ? (
                  <Warehouse className="w-6 h-6 text-gray-400" />
                ) : (
                  <MapPin className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No {locationType === "warehouse" ? "warehouses" : "locations"} found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Create a new {locationType === "warehouse" ? "warehouse" : "location"} to get started
              </p>
              {locationType === "warehouse" && (
                <Button
                  className="mt-5 bg-primary hover:bg-primary/90 rounded-lg text-sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon className="w-4 h-4 mr-1.5" />
                  Create Warehouse
                </Button>
              )}
            </div>
          ) : (
            displayedItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleLocationSelect(item, index)}
                disabled={pendingIndex === index || isRedirecting}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
                  pendingIndex === index
                    ? "border-primary/30 bg-primary/5"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary/30 hover:shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    locationType === "warehouse"
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-primary/10",
                  )}
                >
                  {locationType === "warehouse" ? (
                    <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </h3>
                    {getStatusBadge(item)}
                  </div>
                  {item.city && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {item.city}
                        {item.address ? ` · ${item.address}` : ""}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {pendingIndex === index ? (
                    <Loader2Icon className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Create warehouse */}
        {locationType === "warehouse" && displayedItems.length > 0 && (
          <div className="mt-5">
            <Button
              variant="outline"
              className="w-full rounded-xl border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/40 hover:text-primary transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Create New Warehouse
            </Button>
          </div>
        )}

        {/* Switch business */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              setIsRedirecting(true);
              await clearBusiness();
              window.location.href = "/select-business";
            }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            Switch business
          </button>
        </div>
      </div>

      <PaymentStatusModal
        isOpen={isModalOpen}
        status={paymentStatus}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default LocationList;
