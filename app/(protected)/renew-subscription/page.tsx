"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
import { InvoiceViewDialog } from "@/components/billing/invoice-view-dialog";
import SubscriptionPlanCard from "@/components/subscription/subscriptionPlanCard";
import AdditionalServiceCard from "@/components/subscription/additionalServiceCard";
import type {
  Addon,
  BillingInvoice,
  Package,
  Subscription,
  SubscriptionItem,
} from "@/types/billing/types";
import {
  Receipt,
  Loader2,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
} from "lucide-react";

export default function RenewSubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentItem, setCurrentItem] = useState<SubscriptionItem | undefined>();
  const [pendingInvoice, setPendingInvoice] = useState<BillingInvoice | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

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
      toast({
        variant: "destructive",
        title: "Failed to load subscription data",
      });
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
      .catch(() =>
        toast({
          variant: "destructive",
          title: "Failed to load plan options",
        }),
      );
  }, [isModifying, toast]);

  // ── Handlers ───────────────────────────────────────────────────────

  const handleChangePlan = useCallback(
    async (plan: Package) => {
      if (!subscription || !currentItem || plan.id === currentItem.packageInfo?.id) return;
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
      const has = currentItem.addons.some((a) => a.id === addon.id);
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
        toast({
          variant: "destructive",
          title: `Failed to ${has ? "remove" : "add"} addon`,
        });
      }
    },
    [subscription, currentItem, loadData, toast],
  );

  /**
   * Open the invoice details dialog. When there's already a pending invoice
   * we route the merchant straight to it. Otherwise we generate a 1-month
   * prepayment invoice first, then open it.
   */
  const handleGenerateAndOpen = useCallback(async () => {
    if (!subscription) {
      toast({ variant: "destructive", title: "No subscription found" });
      return;
    }
    if (pendingInvoice) {
      setOpenInvoiceId(pendingInvoice.id);
      return;
    }
    setIsGenerating(true);
    try {
      const prepayment = await prepaySubscription(subscription.id, 1);
      setOpenInvoiceId(prepayment.invoiceId);
    } catch (error: unknown) {
      // If the period already has a pending invoice (409), recover it.
      const err = error as { status?: number; message?: string };
      const isConflict =
        err.status === 409 ||
        (err.message ?? "")
          .toLowerCase()
          .includes("invoice already exists");
      if (isConflict) {
        const pending = await getPendingInvoice(subscription.id);
        if (pending) {
          setOpenInvoiceId(pending.id);
          setPendingInvoice(pending);
          return;
        }
      }
      toast({
        variant: "destructive",
        title: "Failed to create invoice",
        description: (error as Error)?.message,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [subscription, pendingInvoice, toast]);

  const getActionType = useCallback(
    (
      plan: Package,
    ): "upgrade" | "downgrade" | "renew" | "switch" | "subscribe" => {
      if (!currentItem) return "subscribe";
      if (plan.id === currentItem.packageInfo?.id) return "renew";
      const currentPkg = packages.find((p) => p.id === currentItem.packageInfo?.id);
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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Current Plan
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {currentItem.packageInfo?.name ?? "Trial plan"}
              </p>
              {currentItem.addons.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentItem.addons.map((a) => a.name).join(", ")}
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
                <h3 className="text-sm font-semibold text-gray-900">
                  Available Plans
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={plan.id === currentItem?.packageInfo?.id}
                    isCurrent={plan.id === currentItem?.packageInfo?.id}
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
                    isAdded={
                      currentItem?.addons.some((a) => a.id === addon.id) ?? false
                    }
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
                  {new Date(pendingInvoice.periodStart).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {" — "}
                  {new Date(pendingInvoice.periodEnd).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="h-px bg-gray-100" />
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total Due</span>
                <span>
                  {pendingInvoice.currency}{" "}
                  {pendingInvoice.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Due date</span>
                <span>
                  {new Date(pendingInvoice.dueDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
              <p className="text-sm text-gray-600">
                No pending invoice found. A new invoice for 1 month will be
                generated when you continue.
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleGenerateAndOpen}
            disabled={isGenerating}
            className="w-full h-10 rounded-xl font-semibold text-sm bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating invoice…
              </>
            ) : pendingInvoice ? (
              <>
                <DollarSign className="h-4 w-4 mr-1.5" />
                View invoice &amp; pay
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-1.5" />
                Generate invoice &amp; pay
              </>
            )}
          </Button>
        </div>
      </div>

      <InvoiceViewDialog
        open={openInvoiceId !== null}
        onOpenChange={(open) => !open && setOpenInvoiceId(null)}
        invoiceId={openInvoiceId}
        businessId={subscription?.businessId}
        locationId={currentItem?.entityId}
        onPaid={() => {
          setOpenInvoiceId(null);
          void loadData();
        }}
        onCancelled={() => {
          setOpenInvoiceId(null);
          void loadData();
        }}
      />
    </div>
  );
}
