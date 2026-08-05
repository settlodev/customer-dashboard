"use client";

import { useState, useTransition } from "react";
import { Eye, KeyRound, RotateCw, Search, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { impersonateStaffMember } from "@/lib/actions/admin/impersonation";
import {
  findStaffTargets,
  revealMasterKey,
  rotateMasterKey,
} from "@/lib/actions/admin/master-key";
import type { StaffImpersonationTarget } from "@/types/admin/master-key";

/** What to call a target when the staff record has no name on it. */
function targetName(t: StaffImpersonationTarget): string {
  const full = [t.firstName, t.lastName].filter(Boolean).join(" ").trim();
  return full || t.email || "Unnamed staff member";
}

/** What business this target belongs to, for telling duplicates apart. */
function targetWhere(t: StaffImpersonationTarget): string {
  return t.businessName || t.accountEmail || t.accountId;
}

export function StaffLoginView() {
  const [email, setEmail] = useState("");
  const [targets, setTargets] = useState<StaffImpersonationTarget[] | null>(null);
  const [selected, setSelected] = useState<StaffImpersonationTarget | null>(null);
  const [masterKey, setMasterKey] = useState("");
  const [reason, setReason] = useState("");

  const [isFinding, startFind] = useTransition();
  const [isRevealing, startReveal] = useTransition();
  const [isRotating, startRotate] = useTransition();
  const [isLaunching, startLaunch] = useTransition();

  const busy = isFinding || isRevealing || isRotating || isLaunching;

  const onFind = () => {
    startFind(async () => {
      const result = await findStaffTargets(email);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Lookup failed",
          description: result.message,
        });
        return;
      }
      setTargets(result.targets);
      // One match is the common case — select it so the operator doesn't have
      // to click a list of one.
      setSelected(result.targets.length === 1 ? result.targets[0] : null);
    });
  };

  /**
   * Fill the key field from the current value. Auth records a MASTER_KEY_VIEWED
   * row naming you on every use, so this stays an explicit click rather than
   * something that happens on page load.
   */
  const onFillKey = () => {
    startReveal(async () => {
      const result = await revealMasterKey();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Couldn't read the key",
          description: result.message,
        });
        return;
      }
      setMasterKey(result.data.key);
    });
  };

  const onRotate = () => {
    startRotate(async () => {
      const result = await rotateMasterKey();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Rotation failed",
          description: result.message,
        });
        return;
      }
      setMasterKey(result.data.key);
      toast({
        title: "Master key rotated",
        description:
          "The previous key stopped working immediately, for everyone.",
      });
    });
  };

  const onLaunch = () => {
    if (!selected) return;
    startLaunch(async () => {
      const res = await impersonateStaffMember({
        accountId: selected.accountId,
        staffId: selected.staffId,
        masterKey,
        reason,
      });
      if (res.responseType === "success" && res.data?.url) {
        window.open(res.data.url, "_blank", "noopener");
        // Clear the credential and the reason; leave the lookup so the operator
        // can open a second session for the same person without re-searching.
        setMasterKey("");
        setReason("");
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't log in as staff",
          description: res.message,
        });
      }
    });
  };

  const canLaunch =
    Boolean(selected) && masterKey.trim().length > 0 && reason.trim().length > 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Step 1 — who */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-sm font-medium">Staff member</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Their dashboard sign-in email. Only active staff with dashboard access
          can be opened.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-[16rem] flex-1 space-y-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              autoComplete="off"
              placeholder="asha@merchant.co.tz"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTargets(null);
                setSelected(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && email.trim() && !busy) onFind();
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onFind}
            disabled={busy || !email.trim()}
          >
            <Search className="mr-1.5 h-4 w-4" />
            {isFinding ? "Searching…" : "Find"}
          </Button>
        </div>

        {targets !== null && targets.length === 0 ? (
          <p className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            No eligible staff member for that address. They may be inactive, have
            no dashboard access, or never have finished setting up their sign-in.
          </p>
        ) : null}

        {targets && targets.length > 1 ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              That address works for {targets.length} businesses — pick one.
            </p>
            <div className="space-y-1.5">
              {targets.map((t) => {
                const active = selected?.staffId === t.staffId;
                return (
                  <button
                    key={t.staffId}
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{targetWhere(t)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {targetName(t)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {targets && targets.length === 1 && selected ? (
          <p className="mt-4 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-medium">{targetName(selected)}</span>
              <span className="text-muted-foreground">
                {" "}
                at {targetWhere(selected)}
              </span>
            </span>
          </p>
        ) : null}
      </div>

      {/* Step 2 — authorise */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Authorisation</h2>
            <p className="text-sm text-muted-foreground">
              The master key rotates daily. Reading it and using it are both
              recorded against your account.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="master-key">Master key</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="master-key"
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="MK-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="min-w-[18rem] flex-1 font-mono tracking-wider"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onFillKey}
                disabled={busy}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {isRevealing ? "Reading…" : "Use current key"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              maxLength={500}
              placeholder="SUP-4412 — staff reports wrong dashboard totals"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required. Stored on the audit record for this session.
            </p>
          </div>

          <Button type="button" onClick={onLaunch} disabled={busy || !canLaunch}>
            {isLaunching
              ? "Opening…"
              : selected
                ? `Log in as ${targetName(selected)}`
                : "Log in as staff"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Opens their dashboard in a new tab. The session lasts 30 minutes and
            carries only their own permissions.
          </p>
        </div>
      </div>

      {/* Secondary — leak response */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="text-sm font-medium">Rotate the key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only if you think the current value has leaked. It stops working
          everywhere immediately, including for anyone mid-session.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRotate}
          disabled={busy}
        >
          <RotateCw className="mr-1.5 h-4 w-4" />
          {isRotating ? "Rotating…" : "Rotate now"}
        </Button>
      </div>
    </div>
  );
}
