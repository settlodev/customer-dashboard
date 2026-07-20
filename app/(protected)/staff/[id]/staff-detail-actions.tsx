"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  AtSign,
  KeyRound,
  LockKeyhole,
  Mail,
  MoreVertical,
  Shield,
  ShieldOff,
  UserMinus,
  Smartphone,
  SmartphoneCharging,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Staff } from "@/types/staff";
import {
  clearStaffPin,
  deactivateStaff,
  forceStaffPasswordReset,
  grantDashboardAccess,
  grantPosAccess,
  reactivateStaff,
  resendStaffInvite,
  revokeDashboardAccess,
  revokePosAccess,
  setStaffPin,
} from "@/lib/actions/staff-actions";
import { StaffChangeEmailDialog } from "@/components/staff/staff-change-email-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { StaffDeactivateDialog } from "@/components/staff/staff-deactivate-dialog";

/**
 * Header action menu for the staff detail page. Surfaces every
 * lifecycle / access action the merchant can take from one place so the
 * detail header doesn't grow a long row of buttons. Mirrors the product
 * detail-actions pattern: a single overflow menu plus modals for
 * destructive / credential-bearing actions.
 */
export function StaffDetailActions({ staff }: { staff: Staff }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const [dashboardEmail, setDashboardEmail] = useState(staff.email ?? "");

  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinStep, setPinStep] = useState<1 | 2>(1);

  const openPinDialog = () => {
    setPin("");
    setPinConfirm("");
    setPinStep(1);
    setPinOpen(true);
  };

  const fullName = `${staff.firstName} ${staff.lastName}`;

  const run = async (
    key: string,
    action: () => Promise<{ responseType?: string; message: string } | void>,
    successTitle: string,
    after?: () => void,
  ) => {
    setLoading(key);
    try {
      const result = (await action()) ?? { responseType: "success", message: successTitle };
      const ok = result.responseType !== "error";
      toast({
        variant: ok ? "success" : "destructive",
        title: ok ? successTitle : "Action failed",
        description: result.message,
      });
      if (ok) {
        after?.();
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: (error as Error).message,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Dashboard access
          </DropdownMenuLabel>
          {staff.dashboardAccess ? (
            <>
              <DropdownMenuItem
                disabled={loading !== null}
                onClick={() =>
                  run("dash-resend", () => resendStaffInvite(staff.id), "Invite email re-sent")
                }
              >
                <Mail className="mr-2 h-4 w-4" />
                Resend invite
              </DropdownMenuItem>
              {/* Owners manage their own login from their profile — the backend
                  rejects both of these for the owner record, so don't offer them. */}
              {!staff.owner && (
                <>
                  <DropdownMenuItem
                    disabled={loading !== null}
                    onClick={() => setEmailOpen(true)}
                  >
                    <AtSign className="mr-2 h-4 w-4" />
                    Change login email…
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={loading !== null}
                    onClick={() => setResetOpen(true)}
                  >
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Reset password…
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                disabled={loading !== null || staff.owner}
                onClick={() =>
                  run("dash-revoke", () => revokeDashboardAccess(staff.id), "Dashboard access revoked")
                }
                className="text-amber-600 focus:text-amber-600"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke dashboard
              </DropdownMenuItem>
            </>
          ) : staff.active ? (
            <DropdownMenuItem
              disabled={loading !== null}
              onClick={() => {
                setDashboardEmail(staff.email ?? "");
                setDashboardOpen(true);
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Grant dashboard…
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            POS access
          </DropdownMenuLabel>
          {staff.posAccess ? (
            <>
              {staff.active && (
                <>
                  <DropdownMenuItem disabled={loading !== null} onClick={openPinDialog}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {staff.hasPin ? "Reset PIN…" : "Set PIN…"}
                  </DropdownMenuItem>
                  {staff.hasPin && (
                    <DropdownMenuItem
                      disabled={loading !== null}
                      onClick={() => run("pin-clear", () => clearStaffPin(staff.id), "PIN cleared")}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Clear PIN
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuItem
                disabled={loading !== null || staff.owner}
                onClick={() => run("pos-revoke", () => revokePosAccess(staff.id), "POS access revoked")}
                className="text-amber-600 focus:text-amber-600"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Revoke POS
              </DropdownMenuItem>
            </>
          ) : staff.active ? (
            <DropdownMenuItem
              disabled={loading !== null}
              onClick={() => run("pos-grant", () => grantPosAccess(staff.id), "POS access granted")}
            >
              <SmartphoneCharging className="mr-2 h-4 w-4" />
              Grant POS
            </DropdownMenuItem>
          ) : null}

          {!staff.owner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Roster
              </DropdownMenuLabel>
              {staff.active ? (
                <DropdownMenuItem
                  onClick={() => setDeactivateOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={loading !== null}
                  onClick={() =>
                    run(
                      "reactivate",
                      () => reactivateStaff(staff.id),
                      "Staff reactivated",
                    )
                  }
                  className="text-emerald-600 focus:text-emerald-600"
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Deactivate confirmation */}
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

      {/* Change login email */}
      <StaffChangeEmailDialog
        staffId={staff.id}
        fullName={fullName}
        currentEmail={staff.email}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

      {/* Force password reset */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset dashboard password</DialogTitle>
            <DialogDescription>
              We&apos;ll email {staff.email || fullName} a link to choose a new
              password and sign them out of the dashboard everywhere. Their
              current password keeps working until they use the link, so a
              missed email won&apos;t lock them out. Their POS PIN is
              unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetOpen(false)}
              disabled={loading === "pw-reset"}
            >
              Cancel
            </Button>
            <Button
              disabled={loading === "pw-reset"}
              onClick={() =>
                run(
                  "pw-reset",
                  () => forceStaffPasswordReset(staff.id),
                  "Password reset link sent",
                  () => setResetOpen(false),
                )
              }
            >
              {loading === "pw-reset" ? "Sending…" : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant dashboard access */}
      <Dialog open={dashboardOpen} onOpenChange={setDashboardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant dashboard access</DialogTitle>
            <DialogDescription>
              We&apos;ll email {fullName} a secure link to set their own
              password. Confirm the email address to send the invite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="staff@example.com"
                value={dashboardEmail}
                onChange={(e) => setDashboardEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDashboardOpen(false)}
              disabled={loading === "dash-grant"}
            >
              Cancel
            </Button>
            <Button
              disabled={!dashboardEmail || loading === "dash-grant"}
              onClick={() =>
                run(
                  "dash-grant",
                  () => grantDashboardAccess(staff.id, dashboardEmail),
                  "Dashboard access granted",
                  () => setDashboardOpen(false),
                )
              }
            >
              {loading === "dash-grant" ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set / Reset PIN */}
      <Dialog open={pinOpen} onOpenChange={setPinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {staff.hasPin ? "Reset POS PIN" : "Set POS PIN"}
            </DialogTitle>
            <DialogDescription>
              {pinStep === 1
                ? "Step 1 of 2 — Enter a 4 digit PIN. Paired POS devices pick up the new value on their next sync."
                : "Step 2 of 2 — Re-enter the same 4 digit PIN to confirm."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <label className="text-sm font-medium text-muted-foreground">
              {pinStep === 1 ? "New PIN" : "Confirm PIN"}
            </label>
            {pinStep === 1 ? (
              <InputOTP
                key="pin-step-1"
                maxLength={4}
                pattern="^[0-9]*$"
                inputMode="numeric"
                value={pin}
                onChange={(value) => setPin(value.replace(/\D/g, ""))}
                autoFocus
              >
                <InputOTPGroup className="gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-20 w-16 text-3xl font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            ) : (
              <InputOTP
                key="pin-step-2"
                maxLength={4}
                pattern="^[0-9]*$"
                inputMode="numeric"
                value={pinConfirm}
                onChange={(value) =>
                  setPinConfirm(value.replace(/\D/g, ""))
                }
                autoFocus
              >
                <InputOTPGroup className="gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-20 w-16 text-3xl font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}
            {pinStep === 2 &&
              pinConfirm.length === 4 &&
              pin !== pinConfirm && (
                <p className="text-xs text-destructive">
                  PINs don&apos;t match
                </p>
              )}
          </div>
          <DialogFooter>
            {pinStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setPinOpen(false)}
                  disabled={loading === "pin-set"}
                >
                  Cancel
                </Button>
                <Button
                  disabled={pin.length !== 4}
                  onClick={() => {
                    setPinConfirm("");
                    setPinStep(2);
                  }}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setPinStep(1)}
                  disabled={loading === "pin-set"}
                >
                  Back
                </Button>
                <Button
                  disabled={
                    pin.length !== 4 ||
                    pin !== pinConfirm ||
                    loading === "pin-set"
                  }
                  onClick={() =>
                    run(
                      "pin-set",
                      () => setStaffPin(staff.id, pin),
                      staff.hasPin ? "PIN reset" : "PIN set",
                      () => setPinOpen(false),
                    )
                  }
                >
                  {loading === "pin-set"
                    ? "Saving…"
                    : staff.hasPin
                      ? "Reset PIN"
                      : "Set PIN"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
