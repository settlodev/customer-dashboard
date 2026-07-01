"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  PauseCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
  purgeAccount,
  reactivateAccount,
  republishAccountEvents,
  resendPhoneVerification,
  resendVerificationEmail,
  suspendAccount,
} from "@/lib/actions/admin/accounts";
import { AdminAccountListItem } from "@/types/admin/account";

interface AccountActionDialogProps {
  kind:
    | "suspend"
    | "reactivate"
    | "delete"
    | "purge"
    | "resend-verification"
    | "resend-phone-verification"
    | "republish";
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
  const isDestructive = kind === "delete" || kind === "purge";
  const tone =
    isDestructive ? "danger" : kind === "suspend" ? "warning" : "success";

  const icon =
    isDestructive ? (
      <Trash2 className="h-5 w-5" />
    ) : kind === "suspend" ? (
      <PauseCircle className="h-5 w-5" />
    ) : kind === "resend-verification" ? (
      <Mail className="h-5 w-5" />
    ) : kind === "resend-phone-verification" ? (
      <MessageSquare className="h-5 w-5" />
    ) : kind === "republish" ? (
      <RefreshCw className="h-5 w-5" />
    ) : (
      <CheckCircle2 className="h-5 w-5" />
    );

  const title =
    kind === "delete"
      ? "Delete this account?"
      : kind === "purge"
        ? "Permanently purge this account?"
        : kind === "suspend"
        ? "Suspend this account?"
        : kind === "resend-verification"
          ? "Resend verification email?"
          : kind === "resend-phone-verification"
            ? "Send phone verification SMS?"
            : kind === "republish"
              ? "Republish account events?"
              : "Reactivate this account?";

  const description =
    kind === "delete" ? (
      <>
        This soft-deletes <strong>{accountLabel}</strong> and revokes all of
        their sessions. Related data (businesses, locations, staff) will be
        cascade-archived. Type the account email to confirm.
      </>
    ) : kind === "purge" ? (
      <>
        This <strong>permanently and irreversibly</strong> deletes{" "}
        <strong>{accountLabel}</strong> and its login — there is no recovery and
        no 30-day grace. Only for an empty account — no orders, stock or paid
        invoices (the server re-checks and refuses otherwise). Type the account
        email to confirm.
      </>
    ) : kind === "suspend" ? (
      <>
        <strong>{accountLabel}</strong> will be unable to sign in until you
        reactivate them. Optionally include a reason for the audit log.
      </>
    ) : kind === "resend-verification" ? (
      <>
        A new verification link and code will be emailed to{" "}
        <strong>{account.email}</strong>. Any previous link will stop working.
      </>
    ) : kind === "resend-phone-verification" ? (
      <>
        A verification code will be sent by SMS to{" "}
        <strong>{account.phoneNumber || "the number on file"}</strong>. The
        owner enters it to confirm their phone. Rate-limited; any previous code
        stops working.
      </>
    ) : kind === "republish" ? (
      <>
        Re-broadcasts the current state of <strong>{accountLabel}</strong>{" "}
        (account plus the owner identity events) so a downstream consumer that
        drifted out of sync — Reports, or the onboarding/email status shown
        here — can reconcile. Safe to repeat.
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
      : kind === "purge"
        ? "Purge permanently"
        : kind === "suspend"
        ? "Suspend"
        : kind === "resend-verification"
          ? "Send email"
          : kind === "resend-phone-verification"
            ? "Send SMS"
            : kind === "republish"
              ? "Republish"
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
          : kind === "purge"
            ? await purgeAccount(account.id)
            : kind === "suspend"
            ? await suspendAccount(account.id, reason.trim() || undefined)
            : kind === "resend-verification"
              ? await resendVerificationEmail(account.id)
              : kind === "resend-phone-verification"
                ? await resendPhoneVerification(account.id)
                : kind === "republish"
                  ? await republishAccountEvents(account.id)
                  : await reactivateAccount(account.id);

      if (result.responseType === "error") {
        setError(result.message);
        return;
      }

      toast({
        title:
          kind === "delete"
            ? "Account deleted"
            : kind === "purge"
              ? "Account purged"
              : kind === "suspend"
              ? "Account suspended"
              : kind === "resend-verification"
                ? "Verification email sent"
                : kind === "resend-phone-verification"
                  ? "Verification SMS sent"
                  : kind === "republish"
                    ? "Events republished"
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
        requireText={isDestructive ? account.email : undefined}
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

        {isDestructive && <AlertDialogRequireText />}

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
