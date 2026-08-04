"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Archive, Rocket } from "lucide-react";

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
import {
  publishLoanProduct,
  retireLoanProduct,
} from "@/lib/actions/admin/loans";
import type { LoanProductStatus } from "@/types/admin/loans";

interface LoanProductLifecycleProps {
  id: string;
  name: string;
  status: LoanProductStatus;
}

/**
 * Lifecycle actions for a loan product: DRAFT → Publish, PUBLISHED → Retire,
 * RETIRED → nothing (terminal — the LMS refuses to re-publish). There is no
 * pause/resume: `active` only mirrors the status, so the old activate toggle
 * (a PUT with `active`) was silently ignored by the LMS.
 */
export function LoanProductLifecycle({
  id,
  name,
  status,
}: LoanProductLifecycleProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = (action: "publish" | "retire") =>
    startTransition(async () => {
      const res =
        action === "publish"
          ? await publishLoanProduct(id)
          : await retireLoanProduct(id);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: action === "publish" ? "Couldn't publish" : "Couldn't retire",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      setOpen(false);
      router.refresh();
    });

  if (status === "RETIRED") return null;

  if (status === "DRAFT") {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary hover:text-primary"
          >
            Publish
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogIcon>
            <Rocket className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish {name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The product goes live: borrowers can see it and apply, and the
              system may auto-select it for supplier-order financing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                run("publish");
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                "Publish"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // PUBLISHED → Retire (terminal)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-neg"
        >
          Retire
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="warning">
        <AlertDialogIcon>
          <Archive className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Retire {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This is permanent — a retired product cannot be re-published. It
            stops receiving new applications immediately; existing loans are
            not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              run("retire");
            }}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Working…
              </span>
            ) : (
              "Retire"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
