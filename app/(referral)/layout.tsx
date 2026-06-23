import { ReactNode } from "react";

import { logout } from "@/lib/actions/auth-actions";

/**
 * Minimal chrome for the external referral-agent surface. Referral agents are
 * NOT internal staff and have no customer dashboard — this standalone layout
 * (brand + sign out) wraps the single /referral page.
 */
export default function ReferralLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-4 py-3 md:px-8">
          <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">
            Settlo · Referrals
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="font-mono text-[12px] text-muted-foreground transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
