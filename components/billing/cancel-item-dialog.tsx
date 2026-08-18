"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogRequireText,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { removeSubscriptionItem } from "@/lib/actions/billing-actions";
import { ENTITY_TYPE_LABEL } from "./shared";
import type { SubscriptionItem } from "@/types/billing/types";

interface CancelItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  item: SubscriptionItem | null;
  /** Display name for the entity, e.g. "MAM N KIDZ MJIMWEMA". */
  entityName: string;
}

/**
 * Cancels ONE subscribed entity while the rest of the subscription carries on —
 * the "two locations expired, I only want to keep paying for one" case.
 *
 * Deliberately separate from CancelSubscriptionDialog, which ends billing for the
 * whole business. This one is irreversible per entity, so it type-gates on the
 * entity kind and spells out the credit rule, which differs for a lapsed unit.
 */
export function CancelItemDialog({
  open,
  onOpenChange,
  subscriptionId,
  item,
  entityName,
}: CancelItemDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const kind = item ? ENTITY_TYPE_LABEL[item.entityType].toLowerCase() : "entity";
  // Only a paid, current entity has unused time left to refund. A lapsed one owed
  // for the cycle instead of prepaying it, so removing it accrues nothing — say so
  // rather than promising a credit that never arrives.
  const isPaidCurrent =
    !!item?.paidThrough && new Date(item.paidThrough) > new Date();

  const handleCancel = useCallback(async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      await removeSubscriptionItem(subscriptionId, item.id);
      toast({
        title: `${entityName} cancelled`,
        description: `This ${kind} is no longer billed. Your other entities are unaffected.`,
      });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: `Could not cancel ${entityName}`,
        description:
          (error as Error)?.message ?? "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [item, subscriptionId, entityName, kind, toast, onOpenChange, router]);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <AlertDialogContent tone="danger" requireText="CANCEL">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel {entityName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This {kind} stops being billed and loses access. Everything else on
            your subscription keeps running and is invoiced as normal.
            {item?.isBundled === false && item.addons.length > 0
              ? " Its addons are removed too."
              : ""}{" "}
            {isPaidCurrent
              ? "You'll be credited for the unused part of the current period, applied to your next invoice."
              : "There's no credit — this entity hasn't paid for the current period."}{" "}
            This can&apos;t be undone; you&apos;d need to re-add the {kind} to
            bring it back.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogRequireText />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>
            Keep {kind}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Cancelling…
              </>
            ) : (
              `Cancel ${kind}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
