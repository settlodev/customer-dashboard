"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AssignStaffDialog } from "@/components/admin/assign-staff-dialog";
import { Monogram } from "@/components/admin/shared/monogram";
import { AssignedStaffInfo } from "@/types/admin/account";

interface AccountStaffCardProps {
  accountId: string;
  kind: "sales" | "support";
  title: string;
  staff: AssignedStaffInfo | null;
  canEdit: boolean;
}

/**
 * Ownership card (Sales person / Support staff) on the account-detail
 * screen. Shows the assigned internal staffer as a monogram + name + role,
 * or a dashed "Unassigned" placeholder, with an Assign/Change affordance
 * that opens the existing assignment dialog.
 */
export function AccountStaffCard({
  accountId,
  kind,
  title,
  staff,
  canEdit,
}: AccountStaffCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-card px-[18px] py-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[12.5px] font-semibold text-[#C25E26] transition-colors hover:text-[#a04d1d]"
          >
            {staff ? "Change" : "Assign"}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        {staff ? (
          <>
            <Monogram name={staff.fullName} seed={staff.id} size="md" round />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-ink">
                {staff.fullName}
              </div>
              <div className="truncate font-mono text-[11px] capitalize text-muted-foreground">
                {staff.role.replace(/_/g, " ").toLowerCase()}
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-line-2 text-[15px] text-muted-2">
              +
            </span>
            <span className="text-[14px] font-medium text-muted-2">
              Unassigned
            </span>
          </>
        )}
      </div>

      {canEdit && (
        <AssignStaffDialog
          accountId={accountId}
          kind={kind}
          current={staff}
          open={open}
          onOpenChange={setOpen}
          onDone={() => router.refresh()}
        />
      )}
    </div>
  );
}
