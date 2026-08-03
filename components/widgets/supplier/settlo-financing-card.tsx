"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  Wallet,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { withdrawNomination } from "@/lib/actions/supplier-nomination-actions";
import { NOMINATION_STATUS_LABELS } from "@/types/supplier/nomination";
import type { SupplierNomination } from "@/types/supplier/nomination";
import type { Supplier } from "@/types/supplier/type";
import { SubmitNominationDialog } from "./submit-nomination-dialog";

interface Props {
  supplier: Supplier;
  /** Newest nomination for this supplier, or null if none exists yet. */
  nomination: SupplierNomination | null;
}

/**
 * Merchant-facing entry point into the supplier-nomination journey, mounted
 * on the supplier detail page. Five states derived from
 * `supplier.linkedToSettloSupplier` plus the latest nomination's status — a
 * `WITHDRAWN` latest nomination falls back to "not submitted" exactly like
 * having no nomination at all.
 *
 * Financing is no longer offered at purchase-order creation time — it's
 * requested from an *existing* LPO via the "Finance this order" flow
 * (`components/widgets/lpo/financing-banner.tsx`). So the "linked" state
 * here only ever points the merchant at creating an order, never at a
 * financing cap or a direct apply action — there is no preview endpoint to
 * show one.
 */
export function SettloFinancingCard({ supplier, nomination }: Props) {
  const [submitOpen, setSubmitOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const refresh = () => router.refresh();

  const activeStatus =
    !supplier.linkedToSettloSupplier &&
    nomination &&
    nomination.status !== "WITHDRAWN"
      ? nomination.status
      : null;

  const handleWithdraw = () => {
    if (!nomination) return;
    startTransition(async () => {
      const res = await withdrawNomination(nomination.id);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't withdraw",
          description: res.message,
        });
        return;
      }
      toast({
        variant: "success",
        title: "Nomination withdrawn",
        description: res.message,
      });
      setWithdrawOpen(false);
      refresh();
    });
  };

  let icon: React.ReactNode;
  let iconTone: string;
  let title: string;
  let detail: React.ReactNode;
  let action: React.ReactNode = null;

  if (supplier.linkedToSettloSupplier) {
    icon = <CheckCircle2 className="h-5 w-5" />;
    iconTone = "bg-pos text-white";
    title = "Settlo financing available";
    detail = (
      <>
        Create a purchase order for this supplier, then use{" "}
        <span className="font-medium text-foreground">
          Finance this order
        </span>{" "}
        on it to have Settlo pay them on your behalf.
      </>
    );
    action = (
      <Button asChild size="sm">
        <Link href="/purchase-orders/new">
          Create purchase order
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    );
  } else if (activeStatus === "SUBMITTED" && nomination) {
    icon = <Clock3 className="h-5 w-5" />;
    iconTone = "bg-warn-tint text-warn";
    title = NOMINATION_STATUS_LABELS.SUBMITTED;
    detail = `Submitted ${formatDate(nomination.submittedAt)}. Settlo is reviewing this supplier.`;
    action = (
      <AlertDialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isPending}>
            Withdraw
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent tone="warning">
          <AlertDialogIcon>
            <Ban className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this nomination?</AlertDialogTitle>
            <AlertDialogDescription>
              {supplier.name} will no longer be under review. You can submit
              it again any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={isPending}
            >
              {isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Withdraw
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  } else if (activeStatus === "APPROVED") {
    icon = <CheckCircle2 className="h-5 w-5" />;
    iconTone = "bg-pos-tint text-pos";
    title = NOMINATION_STATUS_LABELS.APPROVED;
    detail = `Settlo is setting ${supplier.name} up. We'll tell you when financing is available.`;
  } else if (activeStatus === "REJECTED" && nomination) {
    icon = <XCircle className="h-5 w-5" />;
    iconTone = "bg-neg-tint text-neg";
    title = NOMINATION_STATUS_LABELS.REJECTED;
    detail = (
      <>
        {nomination.rejectionReason ?? "Settlo didn't approve this submission."}{" "}
        Update the supplier&apos;s details and submit again.
      </>
    );
    action = (
      <Button size="sm" onClick={() => setSubmitOpen(true)}>
        Submit
      </Button>
    );
  } else {
    icon = <Wallet className="h-5 w-5" />;
    iconTone = "bg-primary-light text-primary-dark";
    title = "Settlo financing";
    detail = "Settlo can pay this supplier directly for stock you finance.";
    action = (
      <Button size="sm" onClick={() => setSubmitOpen(true)}>
        Submit for Settlo financing
      </Button>
    );
  }

  return (
    <>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full ${iconTone}`}
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">
                {title}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {detail}
              </p>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </CardContent>
      </Card>

      <SubmitNominationDialog
        supplier={supplier}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmitted={refresh}
      />
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
