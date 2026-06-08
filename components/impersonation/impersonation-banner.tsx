"use client";

import { useTransition } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

import { endImpersonation } from "@/lib/actions/auth-actions";

/**
 * Sticky banner shown across the customer shell whenever the session was minted
 * by staff impersonation ("login on behalf"). Exit revokes the short-lived
 * impersonation token, clears the session, and closes the tab (it was opened
 * via window.open, so close() is permitted; falls back to a redirect).
 */
export function ImpersonationBanner({ email }: { email?: string | null }) {
  const [pending, startTransition] = useTransition();

  const onExit = () => {
    startTransition(async () => {
      try {
        await endImpersonation();
      } finally {
        window.close();
        // If the browser refused to close the script-opened tab, bail out.
        window.location.href = "/login?impersonation=ended";
      }
    });
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-[#7C3AED] px-4 py-1.5 text-[12.5px] font-medium text-white">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span className="truncate">
        Support session — viewing{" "}
        {email ? (
          <strong className="font-semibold">{email}</strong>
        ) : (
          "a customer account"
        )}{" "}
        as staff
      </span>
      <button
        type="button"
        onClick={onExit}
        disabled={pending}
        className="ml-1 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-semibold transition-colors hover:bg-white/25 disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {pending ? "Exiting…" : "Exit"}
      </button>
    </div>
  );
}
