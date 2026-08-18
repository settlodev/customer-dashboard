"use client";

import { useState } from "react";
import { ArchiveRestore, UserMinus } from "lucide-react";

import type { Staff } from "@/types/staff";
import {
  deactivateStaff,
  reactivateStaff,
} from "@/lib/actions/staff-actions";
import { useStaffAction } from "@/components/staff/use-staff-action";
import { StaffDeactivateDialog } from "@/components/staff/staff-deactivate-dialog";
import { Button } from "@/components/ui/button";

/**
 * Header actions for the staff detail page — roster lifecycle only.
 *
 * This used to be a single "⋯" menu holding every lifecycle AND access
 * action, which buried a dozen destructive-ish operations behind one
 * unlabelled trigger. Access and credential actions now live on the Access
 * tab, on the card that shows the state each one changes
 * (`staff-access-panel.tsx`); all that remains here is the one action that
 * applies to the whole record.
 */
export function StaffDetailActions({ staff }: { staff: Staff }) {
  const { loading, run } = useStaffAction();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  // The backend rejects deactivating / reactivating the owner-staff record,
  // so the owner header carries no roster action at all.
  if (staff.owner) return null;

  const fullName = `${staff.firstName} ${staff.lastName}`;

  return (
    <>
      {staff.active ? (
        <Button
          variant="outline"
          size="sm"
          className="text-neg hover:text-neg"
          onClick={() => setDeactivateOpen(true)}
        >
          <UserMinus className="h-4 w-4" />
          Deactivate
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-pos hover:text-pos"
          disabled={loading !== null}
          onClick={() =>
            run("reactivate", () => reactivateStaff(staff.id), "Staff reactivated")
          }
        >
          <ArchiveRestore className="h-4 w-4" />
          {loading === "reactivate" ? "Reactivating…" : "Reactivate"}
        </Button>
      )}

      <StaffDeactivateDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        fullName={fullName}
        loading={loading === "deactivate"}
        onConfirm={() =>
          run(
            "deactivate",
            () => deactivateStaff(staff.id),
            "Staff deactivated",
            () => setDeactivateOpen(false),
          )
        }
      />
    </>
  );
}
