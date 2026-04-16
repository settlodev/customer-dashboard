"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  getCurrentSubscription,
  getPendingInvoice,
  getPackages,
} from "@/lib/actions/billing-actions";
import { initiatePayment } from "@/lib/actions/payment-actions";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import PaymentStatusModal from "@/components/widgets/paymentStatusModal";
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
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const { status: paymentStatus, error: paymentError } = usePaymentPolling(paymentRefId);

  const entityLabel = entityType === "STORE" ? "store" : "warehouse";

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const subscription = await getCurrentSubscription();
      if (!subscription) { setHasSubscription(false); return; }

      const item = subscription.items.find(
        (i) => i.entityType === entityType && i.entityId === entityId && i.status === "ACTIVE",
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

  useEffect(() => { checkStatus(); }, [checkStatus]);

  useEffect(() => {
    if (paymentStatus === "SUCCESS") {
      toast({ title: "Payment successful", description: `${entityName} subscription is now active.` });
      setTimeout(() => { setIsModalOpen(false); setPendingInvoice(null); checkStatus(); }, 2000);
    }
    if (paymentStatus === "FAILED") {
      toast({ variant: "destructive", title: "Payment failed", description: paymentError || "Please try again." });
    }
  }, [paymentStatus, paymentError, toast, entityName, checkStatus]);

  const handleSetupSubscription = async () => {
    setIsSettingUp(true);
    try {
      const subscription = await getCurrentSubscription();
      if (!subscription) { toast({ variant: "destructive", title: "No subscription" }); return; }

      const packages = await getPackages(entityType);
      const pkg = packages[0];
      if (!pkg) { toast({ variant: "destructive", title: "No package available" }); return; }

      const BILLING_URL = process.env.NEXT_PUBLIC_BILLING_SERVICE_URL || process.env.BILLING_SERVICE_URL || "";
      const apiClient = new ApiClient();
      await apiClient.post(`${BILLING_URL}/api/v1/subscriptions/${subscription.id}/items`, {
        entityType,
        entityId,
        packageId: pkg.id,
      });

      toast({ variant: "success", title: "Subscription added" });
      await checkStatus();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error?.message });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handlePay = async () => {
    if (!pendingInvoice || !email || !phone) return;
    setIsPaymentSubmitting(true);
    setIsModalOpen(true);
    try {
      const payment = await initiatePayment({
        invoiceId: pendingInvoice.id,
        amount: pendingInvoice.totalAmount,
        currency: pendingInvoice.currency,
        businessId,
        locationId,
        customerPhone: phone,
        customerEmail: email,
        description: `${entityType} subscription - ${entityName}`,
      });
      setPaymentRefId(payment.externalReferenceId);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Payment failed", description: error?.message });
      setIsModalOpen(false);
    } finally {
      setIsPaymentSubmitting(false);
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
            <p className="text-sm font-medium text-green-800">Subscription Active</p>
            <p className="text-xs text-green-600">This {entityLabel} has an active subscription.</p>
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
              <p className="text-sm font-medium text-amber-800">Subscription Required</p>
              <p className="text-xs text-amber-600">
                This {entityLabel} needs a subscription to be fully operational.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleSetupSubscription} disabled={isSettingUp} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isSettingUp ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Setting up...</> : <><CreditCard className="h-4 w-4 mr-1.5" /> Add to Subscription</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-xl border-blue-200 bg-blue-50/50">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Payment Pending</p>
              <p className="text-xs text-blue-600">
                {pendingInvoice!.currency} {pendingInvoice!.totalAmount.toLocaleString()} prorated invoice pending. Active during grace period.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="text-xs font-medium text-blue-700">Email</label>
              <Input placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-9 text-sm bg-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700">Phone</label>
              <PhoneInput placeholder="Phone number" value={phone} onChange={(v) => setPhone(v || "")} className="mt-1 h-9 text-sm" />
            </div>
          </div>
          <Button size="sm" onClick={handlePay} disabled={isPaymentSubmitting || !email || !phone} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isPaymentSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Processing...</> : <><DollarSign className="h-4 w-4 mr-1.5" /> Pay {pendingInvoice!.currency} {pendingInvoice!.totalAmount.toLocaleString()}</>}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-blue-500"><ShieldCheck className="h-3 w-3" /> Secure payment</p>
        </CardContent>
      </Card>
      <PaymentStatusModal isOpen={isModalOpen} status={paymentStatus === "ACCEPTED" ? "PENDING" : paymentStatus === "PROCESSING" ? "PROCESSING" : paymentStatus === "SUCCESS" ? "SUCCESS" : paymentStatus === "FAILED" ? "FAILED" : "INITIATING"} onClose={() => { setIsModalOpen(false); setPaymentRefId(null); }} />
    </>
  );
}
