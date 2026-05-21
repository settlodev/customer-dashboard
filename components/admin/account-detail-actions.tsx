"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PauseCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountActionDialog } from "@/components/admin/account-action-dialog";
import {
  AdminAccountDetail,
  AdminAccountListItem,
} from "@/types/admin/account";

interface AccountDetailActionsProps {
  account: AdminAccountDetail;
  canSuspend: boolean;
  canDelete: boolean;
}

function toListItem(detail: AdminAccountDetail): AdminAccountListItem {
  return {
    id: detail.id,
    fullName: detail.fullName,
    email: detail.email,
    phoneNumber: detail.phoneNumber,
    accountNumber: detail.accountNumber,
    active: detail.active,
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

type ActionKind = "suspend" | "reactivate" | "delete";

export function AccountDetailActions({
  account,
  canSuspend,
  canDelete,
}: AccountDetailActionsProps) {
  const router = useRouter();
  const [active, setActive] = useState<ActionKind | null>(null);

  return (
    <>
      {canSuspend &&
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

      {canDelete && (
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
            if (active === "delete") {
              router.push("/accounts");
            } else {
              router.refresh();
            }
          }}
        />
      )}
    </>
  );
}
