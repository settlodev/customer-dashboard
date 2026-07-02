"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  CheckCircle2,
  FlaskConical,
  Mail,
  MessageSquare,
  PauseCircle,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountActionDialog } from "@/components/admin/account-action-dialog";
import { EditAccountDialog } from "@/components/admin/account-detail/edit-account-dialog";
import { ChangeEmailDialog } from "@/components/admin/account-detail/change-email-dialog";
import { ChangePhoneDialog } from "@/components/admin/account-detail/change-phone-dialog";
import { useToast } from "@/hooks/use-toast";
import { setAccountInternal } from "@/lib/actions/admin/accounts";
import {
  AdminAccountDetail,
  AdminAccountListItem,
} from "@/types/admin/account";

interface AccountDetailActionsProps {
  account: AdminAccountDetail;
  canSuspend: boolean;
  canDelete: boolean;
  canResend: boolean;
  canManage: boolean;
}

function toListItem(detail: AdminAccountDetail): AdminAccountListItem {
  return {
    id: detail.id,
    fullName: detail.fullName,
    email: detail.email,
    phoneNumber: detail.phoneNumber,
    accountNumber: detail.accountNumber,
    active: detail.active,
    internal: detail.internal,
    slug: detail.slug,
    whitelabelAppId: detail.whitelabelAppId,
    whitelabelAppCode: detail.whitelabelAppCode,
    isBusinessRegistrationComplete: detail.isBusinessRegistrationComplete,
    isLocationRegistrationComplete: detail.isLocationRegistrationComplete,
    emailVerified: detail.emailVerified,
    onboardingState: detail.onboardingState,
    assignedSalesStaffId: detail.salesPerson?.id ?? null,
    assignedSupportStaffId: detail.supportStaff?.id ?? null,
    createdAt: detail.createdAt,
  };
}

type ActionKind =
  | "suspend"
  | "reactivate"
  | "delete"
  | "purge"
  | "resend-verification"
  | "resend-phone-verification"
  | "republish";

export function AccountDetailActions({
  account,
  canSuspend,
  canDelete,
  canResend,
  canManage,
}: AccountDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [active, setActive] = useState<ActionKind | null>(null);
  const [markingInternal, startMarkInternal] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  // Once soft-deleted, suspend/reactivate/delete are moot (and reactivate can't
  // un-delete). Hide them so the only destructive action left is Purge.
  const isDeleted = !!account.deletedAt;

  const toggleInternal = () => {
    startMarkInternal(async () => {
      const next = !account.internal;
      const res = await setAccountInternal(account.id, next);
      toast({
        title: next ? "Marked as internal" : "Marked as customer",
        description: res.message,
      });
      if (res.responseType === "success") router.refresh();
    });
  };

  return (
    <>
      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit details
        </Button>
      )}

      {canSuspend && !isDeleted &&
        (account.active ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActive("suspend")}
            className="text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-500/10"
          >
            <PauseCircle className="mr-1.5 h-4 w-4" />
            Suspend
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActive("reactivate")}
            className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Reactivate
          </Button>
        ))}

      {canResend && !account.emailVerified && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive("resend-verification")}
          className="text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/10"
        >
          <Mail className="mr-1.5 h-4 w-4" />
          Resend verification
        </Button>
      )}

      {canResend && !account.emailVerified && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEmailOpen(true)}
          className="text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/10"
        >
          <AtSign className="mr-1.5 h-4 w-4" />
          Change email
        </Button>
      )}

      {/* Change phone is :manage-gated (stricter than the :read email/verify
          actions): it can land on a live account, moving a reset factor. The
          verify-phone SMS below stays on :read (canResend). */}
      {canManage && !account.phoneVerified && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPhoneOpen(true)}
          className="text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/10"
        >
          <Phone className="mr-1.5 h-4 w-4" />
          Change phone
        </Button>
      )}

      {canResend && account.phoneNumber && !account.phoneVerified && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive("resend-phone-verification")}
          className="text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:text-sky-300 dark:hover:bg-sky-500/10"
        >
          <MessageSquare className="mr-1.5 h-4 w-4" />
          Verify phone
        </Button>
      )}

      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleInternal}
          disabled={markingInternal}
          className="text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:text-[#7C3AED]"
        >
          <FlaskConical className="mr-1.5 h-4 w-4" />
          {account.internal ? "Mark as customer" : "Mark as internal"}
        </Button>
      )}

      {canManage && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive("republish")}
          className="text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-500/10"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Republish events
        </Button>
      )}

      {canDelete && !isDeleted && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive("delete")}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Delete
        </Button>
      )}

      {/* Hard-purge: physically removes an EMPTY account (no orders / stock /
          paid invoices). The backend verifies emptiness and 409s otherwise. */}
      {canDelete && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive("purge")}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Purge permanently
        </Button>
      )}

      {active && (
        <AccountActionDialog
          kind={active}
          account={toListItem(account)}
          open={!!active}
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
          onDone={() => {
            setActive(null);
            // If deleted, send the user back to the list; otherwise just
            // refresh the detail view so the badge/state flips.
            if (active === "delete" || active === "purge") {
              router.push("/accounts");
            } else {
              router.refresh();
            }
          }}
        />
      )}

      <EditAccountDialog
        account={account}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ChangeEmailDialog
        accountId={account.id}
        currentEmail={account.email}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
      <ChangePhoneDialog
        accountId={account.id}
        currentPhone={account.phoneNumber}
        open={phoneOpen}
        onOpenChange={setPhoneOpen}
      />
    </>
  );
}
