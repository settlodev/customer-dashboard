"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  getCurrentSubscription,
  getPendingInvoice,
  getPackages,
} from "@/lib/actions/billing-actions";
import { InvoiceViewDialog } from "@/components/billing/invoice-view-dialog";
import { useToast } from "@/hooks/use-toast";
import type { BillingInvoice } from "@/types/billing/types";
import ApiClient from "@/lib/settlo-api-client";

interface EntitySubscriptionSetupProps {
  entityType: "STORE" | "WAREHOUSE";
  entityId: string;
  entityName: string;
  businessId: string;
  locationId: string;
}

export default function EntitySubscriptionSetup({
  entityType,
  entityId,
  entityName,
  businessId,
  locationId,
}: EntitySubscriptionSetupProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<BillingInvoice | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const { toast } = useToast();

  const entityLabel = entityType === "STORE" ? "store" : "warehouse";

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const subscription = await getCurrentSubscription();
      if (!subscription) {
        setHasSubscription(false);
        return;
      }

      const item = subscription.items.find(
        (i) =>
          i.entityType === entityType &&
          i.entityId === entityId &&
          i.status === "ACTIVE",
      );
      setHasSubscription(!!item);

      if (item) {
        const invoice = await getPendingInvoice(subscription.id);
        setPendingInvoice(invoice);
      }
    } catch {
      // Billing not available
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSetupSubscription = async () => {
    setIsSettingUp(true);
    try {
      const subscription = await getCurrentSubscription();
      if (!subscription) {
        toast({ variant: "destructive", title: "No subscription" });
        return;
      }

      const packages = await getPackages(entityType);
      const pkg = packages[0];
      if (!pkg) {
        toast({ variant: "destructive", title: "No package available" });
        return;
      }

      const BILLING_URL =
        process.env.NEXT_PUBLIC_BILLING_SERVICE_URL ||
        process.env.BILLING_SERVICE_URL ||
        "";
      const apiClient = new ApiClient();
      await apiClient.post(
        `${BILLING_URL}/api/v1/subscriptions/${subscription.id}/items`,
        {
          entityType,
          entityId,
          packageId: pkg.id,
        },
      );

      toast({ variant: "success", title: "Subscription added" });
      await checkStatus();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: error?.message,
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking subscription...</span>
        </CardContent>
      </Card>
    );
  }

  if (hasSubscription && !pendingInvoice) {
    return (
      <Card className="rounded-xl border-green-200 bg-green-50/50">
        <CardContent className="py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Subscription Active
            </p>
            <p className="text-xs text-green-600">
              This {entityLabel} has an active subscription.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasSubscription) {
    return (
      <Card className="rounded-xl border-amber-200 bg-amber-50/50">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Subscription Required
              </p>
              <p className="text-xs text-amber-600">
                This {entityLabel} needs a subscription to be fully operational.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSetupSubscription}
            disabled={isSettingUp}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSettingUp ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Setting up...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-1.5" /> Add to Subscription
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-xl border-blue-200 bg-blue-50/50">
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Pending</p>
              <p className="text-xs text-blue-600">
                {pendingInvoice!.currency}{" "}
                {pendingInvoice!.totalAmount.toLocaleString()} prorated invoice
                pending — pay or cancel from the invoice screen.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setInvoiceOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            Open invoice &amp; pay
          </Button>
        </CardContent>
      </Card>

      <InvoiceViewDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        invoiceId={pendingInvoice?.id ?? null}
        businessId={businessId}
        locationId={locationId}
        onPaid={() => {
          toast({
            title: "Payment successful",
            description: `${entityName} subscription is now active.`,
          });
          setInvoiceOpen(false);
          setPendingInvoice(null);
          void checkStatus();
        }}
        onCancelled={() => {
          setInvoiceOpen(false);
          void checkStatus();
        }}
      />
    </>
  );
}
