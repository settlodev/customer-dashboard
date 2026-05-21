"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, PauseCircle, Trash2 } from "lucide-react";

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
import { FormError } from "@/components/widgets/form-error";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  deleteAccount,
  reactivateAccount,
  suspendAccount,
} from "@/lib/actions/admin/accounts";
import { AdminAccountListItem } from "@/types/admin/account";

interface AccountActionDialogProps {
  kind: "suspend" | "reactivate" | "delete";
  account: AdminAccountListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function AccountActionDialog({
  kind,
  account,
  open,
  onOpenChange,
  onDone,
}: AccountActionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const { toast } = useToast();

  const accountLabel = account.fullName || account.email;
  const tone =
    kind === "delete" ? "danger" : kind === "suspend" ? "warning" : "success";

  const icon =
    kind === "delete" ? (
      <Trash2 className="h-5 w-5" />
    ) : kind === "suspend" ? (
      <PauseCircle className="h-5 w-5" />
    ) : (
      <CheckCircle2 className="h-5 w-5" />
    );

  const title =
    kind === "delete"
      ? "Delete this account?"
      : kind === "suspend"
        ? "Suspend this account?"
        : "Reactivate this account?";

  const description =
    kind === "delete" ? (
      <>
        This soft-deletes <strong>{accountLabel}</strong> and revokes all of
        their sessions. Related data (businesses, locations, staff) will be
        cascade-archived. Type the account email to confirm.
      </>
    ) : kind === "suspend" ? (
      <>
        <strong>{accountLabel}</strong> will be unable to sign in until you
        reactivate them. Optionally include a reason for the audit log.
      </>
    ) : (
      <>
        <strong>{accountLabel}</strong> will regain access immediately. Any
        active subscriptions resume billing as configured.
      </>
    );

  const confirmLabel =
    kind === "delete"
      ? "Delete account"
      : kind === "suspend"
        ? "Suspend"
        : "Reactivate";

  useEffect(() => {
    if (!open) {
      setError("");
      setReason("");
    }
  }, [open]);

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      const result =
        kind === "delete"
          ? await deleteAccount(account.id)
          : kind === "suspend"
            ? await suspendAccount(account.id, reason.trim() || undefined)
            : await reactivateAccount(account.id);

      if (result.responseType === "error") {
        setError(result.message);
        return;
      }

      toast({
        title:
          kind === "delete"
            ? "Account deleted"
            : kind === "suspend"
              ? "Account suspended"
              : "Account reactivated",
        description: result.message,
      });
      onDone();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        tone={tone}
        requireText={kind === "delete" ? account.email : undefined}
      >
        <AlertDialogIcon>{icon}</AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="break-words">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {kind === "suspend" && (
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason" className="text-xs">
              Reason (optional)
            </Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being suspended?"
              maxLength={500}
              rows={3}
              disabled={isPending}
            />
          </div>
        )}

        {kind === "delete" && <AlertDialogRequireText />}

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
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
