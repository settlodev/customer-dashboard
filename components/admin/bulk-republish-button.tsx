"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { republishAllAccounts } from "@/lib/actions/admin/accounts";

/**
 * One-off maintenance action that re-emits ACCOUNT_UPDATED for every
 * non-deleted account so Reports' dim_account recovers each account's created
 * date — the "Accounts created" dashboard card reads zero until this runs.
 *
 * Re-emits ACCOUNT_UPDATED only: it sends NO welcome/verification emails (those
 * ride separate topics) and is idempotent. Gated by internal:accounts:manage,
 * the same permission the backend endpoint requires.
 */
export function BulkRepublishButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      const result = await republishAllAccounts();
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({
        title: "Accounts backfilled",
        description: result.message,
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-500/10"
      >
        <RefreshCw className="mr-1.5 h-4 w-4" />
        Backfill accounts
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (isPending) return;
          setOpen(next);
          if (!next) setError("");
        }}
      >
        <AlertDialogContent tone="success">
          <AlertDialogIcon>
            <RefreshCw className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Backfill all accounts?</AlertDialogTitle>
            <AlertDialogDescription>
              Re-emits <strong>ACCOUNT_UPDATED</strong> for every non-deleted
              account so analytics recover each account&apos;s created date —
              this fixes the <strong>Accounts created</strong> dashboard card
              reading zero. It sends{" "}
              <strong>no welcome or verification emails</strong> and is safe to
              repeat. Make sure the Reports Service is deployed with the
              created-date fix first.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && <FormError message={error} />}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Working…
                </span>
              ) : (
                "Backfill accounts"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
