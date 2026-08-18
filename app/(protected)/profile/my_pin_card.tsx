"use client";

import React, { useEffect, useState } from "react";
import { KeyRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getMyStaff, setMyPin } from "@/lib/actions/staff-actions";
import { Staff } from "@/types/staff";

/**
 * Self-service POS PIN management for the currently signed-in user.
 *
 * Only renders when the caller has a linked {@link Staff} record with POS
 * access enabled. Dashboard-only principals (external auditors, internal
 * operators) have no PIN concept, so the card silently stays hidden for
 * them — checked by calling {@code GET /api/v1/staff/me} on mount.
 */
export default function MyPinCard() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyStaff().then((result) => {
      if (!cancelled) {
        setStaff(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The card is only useful for staff who can actually log in at a POS.
  // Admin-only dashboard users, external collaborators, and SAAS
  // operators don't see the section at all.
  if (loading) return null;
  if (!staff || !staff.posAccess) return null;

  const canSubmit =
    pin.length >= 4 && pin.length <= 6 && pin === confirm && !saving;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const result = await setMyPin(pin);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.message,
      });
      if (result.responseType === "success") {
        setDialogOpen(false);
        setPin("");
        setConfirm("");
        // Refresh staff info so hasPin flips correctly.
        const updated = await getMyStaff();
        setStaff(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            <KeyRoundIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-medium">POS PIN</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {staff.hasPin
                ? `Your POS PIN is set${staff.pinUpdatedAt ? ` — last updated ${new Date(staff.pinUpdatedAt).toLocaleDateString()}` : ""}. Rotate it if you think someone else knows it.`
                : "You don't have a POS PIN yet. Set one to log in at a terminal."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant={staff.hasPin ? "outline" : "default"}
          onClick={() => {
            setPin("");
            setConfirm("");
            setDialogOpen(true);
          }}
        >
          {staff.hasPin ? "Change PIN" : "Set PIN"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{staff.hasPin ? "Change POS PIN" : "Set POS PIN"}</DialogTitle>
            <DialogDescription>
              Pick a 4-6 digit PIN. Paired devices pick up the new PIN on their
              next sync — a brief delay if the device is offline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="4-6 digits"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="Re-enter the PIN"
                maxLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
              />
              {confirm && pin !== confirm && (
                <p className="text-xs text-destructive">PINs don&apos;t match</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {saving ? "Saving..." : staff.hasPin ? "Change PIN" : "Set PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
