"use client";

import * as Sentry from "@sentry/nextjs";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  getMyAccountsContext,
  switchAccount,
  type MeAccount,
} from "@/lib/actions/profile-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const ACCOUNT_CTX_CACHE_KEY = "settlo:accountSwitcherCtx";

function accountInitials(name?: string | null) {
  if (!name) return "AC";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second =
    parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase() || "AC";
}

/**
 * "Switch account" section for the sidebar account menu. A user can belong to
 * several accounts — their own plus any they were invited into (e.g. a
 * director across businesses owned by different people). Renders nothing when
 * the user has only one account. Fetches lazily (it only mounts when the
 * account-menu popover opens), then drives the existing `switchAccount` action
 * which re-mints the token for the chosen account.
 */
export function AccountSwitcher() {
  const [accounts, setAccounts] = useState<MeAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<MeAccount | null>(null);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    // Try cache first — avoids a server round-trip on every popover open.
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(ACCOUNT_CTX_CACHE_KEY);
        if (cached) {
          const ctx = JSON.parse(cached) as {
            accounts: MeAccount[];
            currentAccountId: string | null;
          };
          setAccounts(ctx.accounts);
          setCurrentAccountId(ctx.currentAccountId);
          return () => { active = false; };
        }
      } catch {
        // Corrupt or missing — fall through to server fetch
      }
    }

    getMyAccountsContext()
      .then((ctx) => {
        if (!active) return;
        setAccounts(ctx.accounts);
        setCurrentAccountId(ctx.currentAccountId);
        try {
          sessionStorage.setItem(ACCOUNT_CTX_CACHE_KEY, JSON.stringify(ctx));
        } catch {
          // sessionStorage unavailable — fine, just won't cache
        }
      })
      .catch((error) => Sentry.captureException(error));
    return () => {
      active = false;
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    setSwitching(true);
    try {
      const res = await switchAccount(confirm.id);
      if (res.responseType === "success") {
        // Invalidate the cache so the next mount re-fetches with the new
        // current account; then hard-nav so the re-minted token takes hold.
        try { sessionStorage.removeItem(ACCOUNT_CTX_CACHE_KEY); } catch {}
        window.location.href = "/select-business";
        return;
      }
      // Surface the real reason instead of silently closing.
      Sentry.captureException(new Error(res.message || "Account switch failed"));
      setSwitching(false);
      setConfirm(null);
      toast({
        variant: "destructive",
        title: "Couldn't switch account",
        description: res.message || "Please try again in a moment.",
      });
    } catch (error) {
      Sentry.captureException(error);
      setSwitching(false);
      setConfirm(null);
      toast({
        variant: "destructive",
        title: "Couldn't switch account",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
      });
    }
  }, [confirm, toast]);

  // Only meaningful when the user belongs to more than one account.
  if (accounts.length <= 1) return null;

  return (
    <>
      <div className="px-1.5 pb-1 pt-1.5">
        <div className="flex items-center justify-between px-1.5 pb-1.5 pt-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
          <span>Switch account</span>
          <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] tracking-wider text-muted-2">
            {accounts.length}
          </span>
        </div>
        <div className="flex flex-col gap-px">
          {accounts.map((a) => {
            const isCurrent = currentAccountId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  if (!isCurrent) setConfirm(a);
                }}
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
                  {accountInitials(a.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium leading-tight tracking-tight text-ink">
                    {a.name}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {a.owner ? "Owner" : "Member"}
                    {a.identifier ? ` · ${a.identifier}` : ""}
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
        </div>
      </div>
      <div className="mx-2 my-1 h-px bg-line" />

      <Dialog
        open={!!confirm}
        onOpenChange={(o) => {
          if (!o && !switching) setConfirm(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch account</DialogTitle>
            <DialogDescription>
              Switch to <strong>{confirm?.name}</strong>? You&apos;ll be taken
              to choose a business in that account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={switching}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={switching}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {switching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
