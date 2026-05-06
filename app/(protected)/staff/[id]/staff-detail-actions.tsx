"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRestore,
  KeyRound,
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
  grantDashboardAccess,
  grantPosAccess,
  reactivateStaff,
  revokeDashboardAccess,
  revokePosAccess,
  setStaffPin,
} from "@/lib/actions/staff-actions";
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
  const [pinOpen, setPinOpen] = useState(false);

  const [dashboardEmail, setDashboardEmail] = useState(staff.email ?? "");
  const [dashboardPassword, setDashboardPassword] = useState("");

  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");

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
            <DropdownMenuItem
              disabled={loading !== null || staff.owner}
              onClick={() =>
                run(
                  "dash-revoke",
                  () => revokeDashboardAccess(staff.id),
                  "Dashboard access revoked",
                )
              }
              className="text-amber-600 focus:text-amber-600"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke dashboard
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={loading !== null}
              onClick={() => {
                setDashboardEmail(staff.email ?? "");
                setDashboardPassword("");
                setDashboardOpen(true);
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Grant dashboard…
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            POS access
          </DropdownMenuLabel>
          {staff.posAccess ? (
            <>
              <DropdownMenuItem
                disabled={loading !== null}
                onClick={() => {
                  setPin("");
                  setPinConfirm("");
                  setPinOpen(true);
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                {staff.hasPin ? "Reset PIN…" : "Set PIN…"}
              </DropdownMenuItem>
              {staff.hasPin && (
                <DropdownMenuItem
                  disabled={loading !== null}
                  onClick={() =>
                    run(
                      "pin-clear",
                      () => clearStaffPin(staff.id),
                      "PIN cleared",
                    )
                  }
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Clear PIN
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={loading !== null || staff.owner}
                onClick={() =>
                  run(
                    "pos-revoke",
                    () => revokePosAccess(staff.id),
                    "POS access revoked",
                  )
                }
                className="text-amber-600 focus:text-amber-600"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Revoke POS
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              disabled={loading !== null}
              onClick={() =>
                run(
                  "pos-grant",
                  () => grantPosAccess(staff.id),
                  "POS access granted",
                )
              }
            >
              <SmartphoneCharging className="mr-2 h-4 w-4" />
              Grant POS
            </DropdownMenuItem>
          )}

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
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate {fullName}?</DialogTitle>
            <DialogDescription>
              They will lose POS and dashboard access until reactivated. Their
              record stays so historical sales remain attributed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
              disabled={loading === "deactivate"}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={loading === "deactivate"}
              onClick={() =>
                run(
                  "deactivate",
                  () => deactivateStaff(staff.id),
                  "Staff deactivated",
                  () => setDeactivateOpen(false),
                )
              }
            >
              {loading === "deactivate" ? "Deactivating…" : "Deactivate"}
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
              Set login credentials for {fullName}. Share the password directly
              — the staff member can rotate it after first sign-in.
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={dashboardPassword}
                onChange={(e) => setDashboardPassword(e.target.value)}
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
              disabled={
                !dashboardEmail ||
                dashboardPassword.length < 8 ||
                loading === "dash-grant"
              }
              onClick={() =>
                run(
                  "dash-grant",
                  () =>
                    grantDashboardAccess(
                      staff.id,
                      dashboardEmail,
                      dashboardPassword,
                    ),
                  "Dashboard access granted",
                  () => setDashboardOpen(false),
                )
              }
            >
              {loading === "dash-grant" ? "Granting…" : "Grant access"}
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
              Choose a 4–6 digit PIN. Paired POS devices pick up the new value
              on their next sync.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                placeholder="4–6 digits"
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
                value={pinConfirm}
                onChange={(e) =>
                  setPinConfirm(e.target.value.replace(/\D/g, ""))
                }
              />
              {pinConfirm && pin !== pinConfirm && (
                <p className="text-xs text-destructive">PINs don&apos;t match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPinOpen(false)}
              disabled={loading === "pin-set"}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pin.length < 4 ||
                pin.length > 6 ||
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
