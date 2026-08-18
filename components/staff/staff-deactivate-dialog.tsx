"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StaffDeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullName: string;
  onConfirm: () => void;
  loading?: boolean;
}

/**
 * Single confirmation surface for deactivating a staff member, shared by the
 * staff table row and the detail-page header so the copy stays consistent and
 * accurate (deactivation now revokes dashboard + POS access — see Accounts
 * StaffService.deactivateStaff).
 */
export function StaffDeactivateDialog({
  open,
  onOpenChange,
  fullName,
  onConfirm,
  loading = false,
}: StaffDeactivateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate {fullName}?</DialogTitle>
          <DialogDescription>
            They immediately lose dashboard sign-in and POS access. Their record
            and past sales stay intact — you can reactivate them anytime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
