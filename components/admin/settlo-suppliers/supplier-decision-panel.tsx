"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PauseCircle, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
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
import { setSupplierVerificationStatus } from "@/lib/actions/admin/settlo-suppliers";
import type {
  AdminSettloSupplier,
  SettloSupplierVerificationStatus,
} from "@/types/admin/settlo-suppliers";

interface SupplierDecisionPanelProps {
  supplier: AdminSettloSupplier;
  canManage: boolean;
}

const APPROVE_HELP =
  "Approving enables marketplace listing and financing eligibility";

/**
 * SupplierDecisionPanel — approve/decline/suspend/reactivate for a Settlo
 * supplier. Mirrors `components/admin/loan-application-decision-panel.tsx`'s
 * client shape (useTransition + useToast + router.refresh) but the action
 * set is state-derived rather than a mode picker, since every transition
 * here is a single status flip with no extra fields to collect.
 */
export function SupplierDecisionPanel({
  supplier,
  canManage,
}: SupplierDecisionPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  const apply = (status: SettloSupplierVerificationStatus) => {
    startTransition(async () => {
      const res = await setSupplierVerificationStatus(supplier.id, status);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't update supplier",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-line bg-card">
      <header className="border-b border-line px-5 py-3.5">
        <h3 className="text-sm font-semibold text-ink">Decision</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Change this supplier&apos;s verification status. Recorded against
          your staff account.
        </p>
      </header>

      <div className="space-y-3 p-5">
        {supplier.verificationStatus === "PENDING" && (
          <>
            <Button
              type="button"
              onClick={() => apply("VERIFIED")}
              disabled={isPending}
              className="w-full justify-center bg-pos hover:bg-pos/90"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve
            </Button>
            <p className="text-[11px] text-muted-foreground">{APPROVE_HELP}</p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="w-full justify-center border-neg/40 text-neg hover:bg-neg/5 hover:text-neg"
                >
                  <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                  Decline
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent tone="danger">
                <AlertDialogIcon>
                  <ThumbsDown className="h-5 w-5" />
                </AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Decline {supplier.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The supplier stays out of the marketplace directory until
                    it&apos;s re-reviewed and approved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      apply("REJECTED");
                    }}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Working…
                      </span>
                    ) : (
                      "Decline"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {supplier.verificationStatus === "VERIFIED" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="w-full justify-center border-neg/40 text-neg hover:bg-neg/5 hover:text-neg"
              >
                <PauseCircle className="mr-1.5 h-3.5 w-3.5" />
                Suspend
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <PauseCircle className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspend {supplier.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  It&apos;s removed from the marketplace and loses financing
                  eligibility until reactivated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    apply("SUSPENDED");
                  }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working…
                    </span>
                  ) : (
                    "Suspend"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {supplier.verificationStatus === "REJECTED" && (
          <>
            <Button
              type="button"
              onClick={() => apply("VERIFIED")}
              disabled={isPending}
              className="w-full justify-center bg-pos hover:bg-pos/90"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve (re-review)
            </Button>
            <p className="text-[11px] text-muted-foreground">{APPROVE_HELP}</p>
          </>
        )}

        {supplier.verificationStatus === "SUSPENDED" && (
          <Button
            type="button"
            onClick={() => apply("VERIFIED")}
            disabled={isPending}
            className="w-full justify-center bg-pos hover:bg-pos/90"
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Reactivate
          </Button>
        )}
      </div>
    </section>
  );
}
