"use client";

/**
 * Bottom sidebar account & business toggle.
 *
 * Replaces the old `UserDropdown` row at the foot of the sidebar with a
 * richer popover that absorbs the business-switching responsibility
 * previously housed in the top `BusinessSwitcher`. Per the redesign:
 *
 *   - Header: avatar + name + email + edit-profile shortcut
 *   - Subscription card: stub (PRO / Trial) until billing data lands
 *   - Switch business: real API (refreshBusiness → switchToLocation)
 *   - Menu: profile, settings, billing, help, shortcuts
 *   - Sign out: real `logout()` action
 *
 * The popover is portaled to the document body and anchored to the
 * trigger button via fixed coords — necessary because the floating
 * sidebar uses overflow:hidden and would otherwise clip a tall menu.
 */

import * as Sentry from "@sentry/nextjs";
import {
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import useColorMode from "@/components/hooks/useColorMode";
import { logout } from "@/lib/actions/auth-actions";
import { refreshBusiness } from "@/lib/actions/business/refresh";
import { switchToLocation } from "@/lib/actions/destination";
import { fetchAllLocations } from "@/lib/actions/location-actions";
import { cn } from "@/lib/utils";
import type { Business } from "@/types/business/type";
import type { ExtendedUser } from "@/types/types";

interface Props {
  user: ExtendedUser;
  currentBusiness?: Business;
  businessList: Business[];
}

function initials(...parts: Array<string | undefined | null>) {
  return parts
    .filter(Boolean)
    .map((s) => (s as string).trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function businessInitials(name?: string | null) {
  if (!name) return "?";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function SidebarAccountMenu({
  user,
  currentBusiness,
  businessList,
}: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    left: number;
    bottom: number;
    width: number;
  } | null>(null);
  const [confirmBiz, setConfirmBiz] = useState<Business | null>(null);
  const [switching, setSwitching] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Theme toggle. `useColorMode` reads from localStorage on the client,
  // so we render a placeholder until mounted to avoid an icon flicker
  // on first paint (matches `ThemeSwitcher`'s pattern).
  const [colorMode, setColorMode] = useColorMode();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => {
    setThemeMounted(true);
  }, []);
  const isDark = themeMounted && colorMode === "dark";

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    user?.email ||
    "Account";
  const userInitials = initials(user?.firstName, user?.lastName) || "U";

  // Position the popover above the button. Bottom-anchored so the menu
  // grows upward as content is added without jumping.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({
        left: r.left,
        bottom: window.innerHeight - r.top + 8,
        width: r.width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handlePickBusiness = (b: Business) => {
    if (currentBusiness?.id === b.id) return;
    setConfirmBiz(b);
    setOpen(false);
  };

  const handleConfirmSwitch = useCallback(async () => {
    if (!confirmBiz) return;
    setSwitching(true);
    try {
      await refreshBusiness(confirmBiz);
      // Auto-pick the location only when there's a single one to choose.
      // Otherwise the merchant lands on the location-picker so they can
      // make an explicit choice.
      const locations = await fetchAllLocations();
      if (locations && locations.length === 1) {
        await switchToLocation(locations[0]);
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/select-location";
      }
    } catch (error) {
      Sentry.captureException(error);
      setSwitching(false);
      setConfirmBiz(null);
    }
  }, [confirmBiz]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      window.location.href = "/login";
    }
  };

  const popover = open && anchor && (
    <div
      ref={popRef}
      role="menu"
      style={{
        position: "fixed",
        left: anchor.left,
        bottom: anchor.bottom,
        width: Math.max(anchor.width, 300),
      }}
      className="z-[1100] flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-[0_1px_0_rgba(20,17,12,0.04),0_24px_60px_-16px_rgba(20,17,12,0.28),0_6px_16px_-6px_rgba(20,17,12,0.10)]"
    >
      {/* identity header */}
      <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-[13.5px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_1px_2px_rgba(20,17,12,0.10)]">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={fullName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-cover"
            />
          ) : (
            userInitials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold tracking-tight text-ink">
            {fullName}
          </div>
          {user?.email && (
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {user.email}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setColorMode(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-ink"
        >
          {!themeMounted ? (
            // Reserve the slot during hydration so the layout doesn't
            // jump once the localStorage-backed theme resolves.
            <span className="h-3.5 w-3.5" />
          ) : isDark ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Subscription card — stub. Real plan / status / progress / next
          charge will replace these placeholders once the billing summary
          endpoint lands. */}
      <div className="mx-1 mb-1.5 mt-2 flex flex-col gap-2.5 rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.05] to-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="rounded bg-primary px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tracking-[0.1em] text-white">
              PRO
            </span>
            <span className="truncate text-[12px] font-medium tracking-tight text-ink">
              {currentBusiness?.name ?? "Workspace"} subscription
            </span>
          </div>
          <span className="flex-shrink-0 rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-2">
            Trial
          </span>
        </div>

        <div className="relative h-1 overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[#FFA876] transition-[width] duration-500"
            style={{ width: "63%" }}
          />
        </div>

        <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
          <span className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
            11 days left
          </span>
          <span className="truncate font-medium tracking-tight text-ink">
            Manage in Billing
          </span>
        </div>

        <Link
          href="/billing"
          onClick={() => setOpen(false)}
          className="rounded-md border border-line bg-card px-2.5 py-1.5 text-center text-[11.5px] font-medium tracking-tight text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          Manage subscription
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {businessList.length > 0 && (
          <div className="px-1.5 pb-1 pt-1.5">
            <div className="flex items-center justify-between px-1.5 pb-1.5 pt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
              <span>Switch business</span>
              <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] tracking-wider text-muted-2">
                {businessList.length}
              </span>
            </div>
            <div className="flex flex-col gap-px">
              {businessList.map((b) => {
                const isCurrent = currentBusiness?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handlePickBusiness(b)}
                    disabled={isCurrent}
                    className={cn(
                      "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                      isCurrent ? "bg-primary/[0.07]" : "hover:bg-canvas",
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-7 w-7 flex-shrink-0 place-items-center overflow-hidden rounded-md border font-mono text-[10.5px] font-medium tracking-wider",
                        isCurrent
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-canvas text-ink",
                      )}
                    >
                      {b.logoUrl ? (
                        <Image
                          src={b.logoUrl}
                          alt={b.name}
                          width={28}
                          height={28}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        businessInitials(b.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium leading-tight tracking-tight text-ink">
                        {b.name}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {b.businessTypeName ?? "Business"}
                      </div>
                    </div>
                    {isCurrent ? (
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    ) : (
                      <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-2 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}

              <Link
                href="/business-registration"
                onClick={() => setOpen(false)}
                className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-muted-foreground transition-colors hover:bg-canvas"
              >
                <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border border-dashed border-line text-muted-foreground">
                  <Plus className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium leading-tight tracking-tight text-ink-2">
                    Add a business
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    Open a new workspace
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {businessList.length > 0 && (
          <div className="mx-2 my-1 h-px bg-line" />
        )}

        <div className="flex flex-col gap-px px-0.5 pb-1">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] tracking-tight text-ink transition-colors hover:bg-canvas"
          >
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">View profile</span>
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] tracking-tight text-ink transition-colors hover:bg-canvas"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">Account settings</span>
          </Link>
          <button
            type="button"
            // TODO: link to in-app help center once route lands.
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] tracking-tight text-ink transition-colors hover:bg-canvas"
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">Help &amp; support</span>
          </button>
        </div>

        <div className="mx-2 my-1 h-px bg-line" />

        <div className="flex flex-col gap-px px-0.5 pb-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSignOutOpen(true);
            }}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] tracking-tight text-neg transition-colors hover:bg-neg-tint disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span className="flex-1 truncate">
              {loggingOut ? "Signing out..." : "Sign out"}
            </span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {loggingOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Logging out...
          </p>
        </div>
      )}

      <div ref={wrapRef} className="w-full">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:bg-canvas",
            open && "border-line bg-card shadow-[0_1px_0_rgba(20,17,12,0.03)]",
          )}
        >
          <div className="relative h-8 w-8 flex-shrink-0">
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-[9px] bg-primary text-[11.5px] font-semibold tracking-wide text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_1px_2px_rgba(20,17,12,0.10)]">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={fullName}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-pos shadow-[0_0_0_2px_hsl(var(--card))]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium leading-tight tracking-tight text-ink">
              {fullName}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-muted-2" />
              <span className="truncate">
                {currentBusiness?.name ?? "No business"}
              </span>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "mr-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-2 transition-transform",
              open && "rotate-180 text-ink",
            )}
          />
        </button>
      </div>

      {popover &&
        typeof document !== "undefined" &&
        createPortal(popover as ReactNode, document.body)}

      <AlertDialog
        open={signOutOpen}
        onOpenChange={(o) => {
          // Don't let the user dismiss while the logout request is in
          // flight — the inflight state would otherwise leak past the
          // dialog and the user would see a confusing half-loading UI.
          if (!o && loggingOut) return;
          setSignOutOpen(o);
        }}
      >
        <AlertDialogContent tone="danger">
          <AlertDialogIcon>
            <LogOut className="h-5 w-5" />
          </AlertDialogIcon>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of Settlo?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to log back in to continue managing{" "}
              {currentBusiness?.name ?? "your workspace"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog mounted while the request runs so we
                // can show the spinner; Radix would otherwise close on
                // click. handleLogout owns the rest of the flow.
                e.preventDefault();
                void handleLogout();
              }}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!confirmBiz}
        onOpenChange={(o) => {
          if (!o && !switching) setConfirmBiz(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch business</DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirmBiz?.name}</strong>? You will be
              redirected to select a location.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmBiz(null)}
              disabled={switching}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSwitch}
              disabled={switching}
              className="bg-primary text-white hover:bg-primary-dark"
            >
              {switching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
