"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cancelSubscription } from "@/lib/actions/billing-actions";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  /** Human-readable plan summary for the confirmation copy. */
  planSummary?: string;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscriptionId,
  planSummary,
}: CancelSubscriptionDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = useCallback(async () => {
    setSubmitting(true);
    try {
      await cancelSubscription(subscriptionId);
      toast({
        title: "Subscription cancelled",
        description:
          "Access continues until the end of your paid period. We've recorded your feedback.",
      });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not cancel subscription",
        description: (error as Error)?.message ?? "Please try again or contact support.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [subscriptionId, toast, onOpenChange, router]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent tone="danger" requireText="CANCEL">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            {planSummary ? `Cancels ${planSummary}. ` : ""}You keep access until the end of your
            paid period. Devices stay paired but no new invoices will be issued. You can reactivate
            any time before that date.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <label className="text-[11.5px] tracking-[0.01em] text-muted-foreground">
            Tell us why (optional — helps us improve)
          </label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What pushed you to cancel today?"
            disabled={submitting}
            className="min-h-[72px] resize-none text-[13px]"
          />
          <AlertDialogRequireText />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Keep subscription</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Cancel subscription"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
