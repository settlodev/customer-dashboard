"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AssignStaffDialog } from "@/components/admin/assign-staff-dialog";
import { AssignedStaffInfo } from "@/types/admin/account";

interface AccountStaffCardProps {
  accountId: string;
  kind: "sales" | "support";
  title: string;
  staff: AssignedStaffInfo | null;
  canEdit: boolean;
}

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
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-7 px-2 text-[12px]"
          >
            {staff ? "Change" : "Assign"}
          </Button>
        )}
      </div>

      {staff ? (
        <div className="mt-2 space-y-1">
          <p className="font-medium text-ink">{staff.fullName}</p>
          <p className="break-all font-mono text-[12px] text-muted-foreground">
            {staff.email}
          </p>
          <p className="font-mono text-[11px] capitalize text-muted-foreground">
            {staff.role.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">Unassigned</p>
      )}

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
