"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMyAccountsContext,
  type MeAccount,
} from "@/lib/actions/profile-actions";

export const ACCOUNT_CTX_CACHE_KEY = "settlo:accountSwitcherCtx";

function accountInitials(name?: string | null) {
  if (!name) return "AC";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second =
    parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase() || "AC";
}

interface AccountSwitcherProps {
  /**
   * Invoked when the user picks a (non-current) account. The parent owns the
   * confirm dialog and the switch flow, and renders the dialog at the account
   * menu's root — see `SidebarAccountMenu`. Keeping the dialog OUT of this
   * component is load-bearing: this list lives inside the account-menu popover,
   * which unmounts on outside-click. A dialog mounted here would be torn down
   * (along with its confirm button's click handler) the instant the user
   * pressed Confirm, so the switch would silently never fire.
   */
  onPick: (account: MeAccount) => void;
}

/**
 * "Switch account" section for the sidebar account menu. A user can belong to
 * several accounts — their own plus any they were invited into (e.g. a
 * director across businesses owned by different people). Renders nothing when
 * the user has only one account. Fetches lazily (it only mounts when the
 * account-menu popover opens). Picking an account is delegated upward via
 * `onPick`; the parent confirms and drives the `switchAccount` action.
 */
export function AccountSwitcher({ onPick }: AccountSwitcherProps) {
  const [accounts, setAccounts] = useState<MeAccount[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

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
                  if (!isCurrent) onPick(a);
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
                    {a.relationship === "OWNER" || (a.relationship == null && a.owner)
                      ? "Owner"
                      : a.relationship === "STAFF"
                        ? "Staff"
                        : "Member"}
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
    </>
  );
}
