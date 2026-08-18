"use client";

import { useState } from "react";
import {
  AtSign,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Shield,
  ShieldOff,
  Smartphone,
  SmartphoneCharging,
  UserCog,
} from "lucide-react";

import type { Staff } from "@/types/staff";
import {
  clearStaffPin,
  forceStaffPasswordReset,
  grantDashboardAccess,
  grantPosAccess,
  resendStaffInvite,
  revokeDashboardAccess,
  revokePosAccess,
  setStaffPin,
} from "@/lib/actions/staff-actions";
import { useStaffAction } from "@/components/staff/use-staff-action";
import { StaffChangeEmailDialog } from "@/components/staff/staff-change-email-dialog";
import { StaffAssignmentsSection } from "@/components/staff/staff-assignments-section";
import {
  FactGrid,
  PanelCard,
  StatusPill,
  fact,
  type Fact,
} from "@/components/layouts/order-detail";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

/**
 * Access tab of the staff detail page.
 *
 * Every credential / access action used to hide behind a single "⋯" menu in
 * the page header, which meant the merchant had to remember what was in there
 * and could not see the state an action would change. Here each action sits on
 * the card that shows its own state — grant/revoke next to the access pill,
 * PIN actions next to the PIN status — so the panel reads as "here is what
 * this person can do, and here is how to change it".
 *
 * Roster lifecycle (deactivate / reactivate) deliberately stays in the header
 * — it is not an access change and applies to the whole record.
 */
export function StaffAccessPanel({ staff }: { staff: Staff }) {
  const { loading, run } = useStaffAction();

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
  const busy = loading !== null;

  // Inactive staff can't be granted anything, and owners manage their own
  // login from their profile (the backend rejects both for the owner record).
  const inactiveNote = !staff.active
    ? "Reactivate this staff member before changing their access."
    : null;

  const dashboardFacts: Fact[] = [
    fact("Login email", staff.email, <Mail className="h-3 w-3" />, {
      mono: true,
    }),
    fact(
      "Sign-in identity",
      staff.authId ? "Linked" : staff.dashboardAccess ? "Invite pending" : null,
      <UserCog className="h-3 w-3" />,
    ),
  ];

  const posFacts: Fact[] = [
    {
      label: "POS PIN",
      icon: <KeyRound className="h-3 w-3" />,
      badge: (
        <StatusPill tone={staff.hasPin ? "pos" : "muted"} dot>
          {staff.hasPin ? "Set" : "Not set"}
        </StatusPill>
      ),
    },
    fact(
      "PIN updated",
      formatDateTime(staff.pinUpdatedAt),
      <KeyRound className="h-3 w-3" />,
      { mono: true },
    ),
  ];

  return (
    <div className="space-y-3.5">
      <PanelCard icon={<Shield className="h-3.5 w-3.5" />} title="Dashboard access">
        <AccessHeader
          enabled={staff.dashboardAccess}
          body={
            staff.dashboardAccess
              ? "Can sign in to the merchant dashboard on the web with the email below."
              : "Cannot sign in to the dashboard. Granting access emails a secure link to set a password."
          }
        />
        <div className="mt-3.5">
          <FactGrid rows={dashboardFacts} cols={2} />
        </div>

        <ActionRow note={inactiveNote}>
          {staff.dashboardAccess ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  run(
                    "dash-resend",
                    () => resendStaffInvite(staff.id),
                    "Invite email re-sent",
                  )
                }
              >
                <Mail className="h-3.5 w-3.5" />
                {loading === "dash-resend" ? "Sending…" : "Resend invite"}
              </Button>
              {!staff.owner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setEmailOpen(true)}
                  >
                    <AtSign className="h-3.5 w-3.5" />
                    Change login email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setResetOpen(true)}
                  >
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Reset password
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="text-warn hover:text-warn"
                    onClick={() =>
                      run(
                        "dash-revoke",
                        () => revokeDashboardAccess(staff.id),
                        "Dashboard access revoked",
                      )
                    }
                  >
                    <ShieldOff className="h-3.5 w-3.5" />
                    {loading === "dash-revoke" ? "Revoking…" : "Revoke access"}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              size="sm"
              disabled={busy || !staff.active}
              onClick={() => {
                setDashboardEmail(staff.email ?? "");
                setDashboardOpen(true);
              }}
            >
              <Shield className="h-3.5 w-3.5" />
              Grant dashboard access
            </Button>
          )}
        </ActionRow>
      </PanelCard>

      <PanelCard icon={<Smartphone className="h-3.5 w-3.5" />} title="POS access">
        <AccessHeader
          enabled={staff.posAccess}
          body={
            staff.posAccess
              ? "Can log in at paired POS terminals with their PIN. Devices pick up PIN changes on their next sync."
              : "Cannot log in at POS terminals."
          }
        />
        <div className="mt-3.5">
          <FactGrid rows={posFacts} cols={2} />
        </div>

        <ActionRow note={inactiveNote}>
          {staff.posAccess ? (
            <>
              {staff.active && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={openPinDialog}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {staff.hasPin ? "Reset PIN" : "Set PIN"}
                  </Button>
                  {staff.hasPin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(
                          "pin-clear",
                          () => clearStaffPin(staff.id),
                          "PIN cleared",
                        )
                      }
                    >
                      {loading === "pin-clear" ? "Clearing…" : "Clear PIN"}
                    </Button>
                  )}
                </>
              )}
              {!staff.owner && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  className="text-warn hover:text-warn"
                  onClick={() =>
                    run(
                      "pos-revoke",
                      () => revokePosAccess(staff.id),
                      "POS access revoked",
                    )
                  }
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  {loading === "pos-revoke" ? "Revoking…" : "Revoke access"}
                </Button>
              )}
            </>
          ) : (
            <Button
              size="sm"
              disabled={busy || !staff.active}
              onClick={() =>
                run("pos-grant", () => grantPosAccess(staff.id), "POS access granted")
              }
            >
              <SmartphoneCharging className="h-3.5 w-3.5" />
              {loading === "pos-grant" ? "Granting…" : "Grant POS access"}
            </Button>
          )}
        </ActionRow>
      </PanelCard>

      {!staff.owner && (
        <PanelCard
          icon={<MapPin className="h-3.5 w-3.5" />}
          title="Additional locations"
        >
          <StaffAssignmentsSection
            staffId={staff.id}
            primaryLocationId={staff.locationId}
          />
        </PanelCard>
      )}

      {/* ── dialogs ─────────────────────────────────────────────────── */}

      <StaffChangeEmailDialog
        staffId={staff.id}
        fullName={fullName}
        currentEmail={staff.email}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />

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
                onChange={(value) => setPinConfirm(value.replace(/\D/g, ""))}
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
            {pinStep === 2 && pinConfirm.length === 4 && pin !== pinConfirm && (
              <p className="text-xs text-destructive">PINs don&apos;t match</p>
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
                    pin.length !== 4 || pin !== pinConfirm || loading === "pin-set"
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
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────────────────

function AccessHeader({
  enabled,
  body,
}: {
  enabled: boolean;
  body: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="max-w-[56ch] text-[13px] leading-relaxed text-ink-3">
        {body}
      </p>
      <StatusPill tone={enabled ? "pos" : "muted"} dot>
        {enabled ? "Enabled" : "Disabled"}
      </StatusPill>
    </div>
  );
}

function ActionRow({
  note,
  children,
}: {
  note?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 border-t border-dashed border-line pt-3.5">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {note && (
        <p className="mt-2.5 text-[11.5px] text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

// Explicit date + time parts joined by hand — `dateStyle` + `timeStyle`
// together insert a locale connector whose wording differs between the Node
// (SSR) and browser ICU builds, which trips React hydration.
const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${DATE_FMT.format(d)}, ${TIME_FMT.format(d)}`;
}
