"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, CalendarPlus, Loader2, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AddAddonDialog } from "@/components/admin/billing/add-addon-dialog";
import { UpgradePlanDialog } from "@/components/admin/billing/upgrade-plan-dialog";
import { formatDate } from "@/components/admin/shared/format";
import { extendEntityTrial } from "@/lib/actions/admin/billing";

import type { SubscriptionItemResponse } from "@/types/admin/billing";

/**
 * The three billing actions for a location's subscription item, carved out of
 * the page so {@code LocationDetailView} can stay a server component — the same
 * split the business detail uses for its edit / log-in-as buttons.
 *
 * Behaviour is carried over verbatim from the entity detail view this page
 * replaced: Billing remains authoritative and still enforces the
 * live-subscription and bundled/cancelled rules, so these buttons are a
 * convenience gate, not the security boundary.
 */
export function LocationBillingActions({
  businessId,
  subscriptionId,
  item,
  isSuperAdmin,
}: {
  businessId: string;
  subscriptionId: string;
  item: SubscriptionItemResponse;
  /** SYSTEM_ADMIN — may override-extend a trial for an entity that already paid. */
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);

  // Normally only a never-paid, non-cancelled entity can be extended. A super
  // admin may override the paid/used block.
  const itemPaidOrUsed = item.paidThrough != null;
  const canExtendTrial =
    item.status !== "CANCELLED" && (!itemPaidOrUsed || isSuperAdmin);
  const isOverrideExtend = canExtendTrial && itemPaidOrUsed;

  function handleExtendTrial() {
    const confirmMsg = itemPaidOrUsed
      ? "Override: this location has already paid or started using. Extend its trial anyway?"
      : "Extend this location's trial?";
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      const res = await extendEntityTrial(businessId, subscriptionId, item.id);
      if (res.responseType === "success") {
        const updated = res.data?.items.find((i) => i.id === item.id);
        toast({
          title: "Trial extended",
          description: updated?.trialEndDate
            ? `New end: ${formatDate(updated.trialEndDate)}`
            : undefined,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't extend",
          description: res.message,
        });
      }
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {canExtendTrial && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleExtendTrial}
            className="text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-1.5 h-4 w-4" />
            )}
            {isOverrideExtend ? "Override extend trial" : "Extend trial"}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setUpgradeOpen(true)}
        >
          <ArrowUpCircle className="mr-1.5 h-4 w-4" />
          Upgrade plan
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAddonOpen(true)}
        >
          <PackagePlus className="mr-1.5 h-4 w-4" />
          Manage addons
        </Button>
      </div>

      {/* Both dialogs take the item list they can act on; scoped to this
          location's single item so neither can retarget a sibling. */}
      <UpgradePlanDialog
        businessId={businessId}
        items={[item]}
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onUpgraded={() => router.refresh()}
      />
      <AddAddonDialog
        businessId={businessId}
        items={[item]}
        open={addonOpen}
        onOpenChange={setAddonOpen}
        onAdded={() => router.refresh()}
      />
    </>
  );
}
