import React from "react";

interface DashboardHeaderProps {
  /** Time-of-day greeting, e.g. "Good evening" — resolved server-side in the
   *  active location's timezone so it tracks the trader's local clock. */
  greeting: string;
  /** The signed-in user's first name. Emphasised in Settlo brand orange. */
  userName: string;
  /** Identity subline (venue · city), rendered in mono muted below the name. */
  subline?: string;
  /** Right-aligned controls — the shared date-range filter. Bottom-aligned to
   *  the greeting to match the design. */
  actions?: React.ReactNode;
}

/**
 * Home-dashboard greeting header — the bespoke `.head` treatment from the
 * "Settlo Home Dashboard" design. Deliberately distinct from the generic
 * {@link PageHeader} every other protected page uses: a larger, tighter
 * greeting with the user's name in brand orange (`text-primary-dark` = the
 * deep `#C25E26`, which clears the large-text contrast bar the brighter
 * `#EB7F44` misses on the light canvas), a mono identity subline, and the
 * date filter bottom-aligned against the greeting.
 */
export function DashboardHeader({
  greeting,
  userName,
  subline,
  actions,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
          {greeting}, <span className="text-primary-dark">{userName}</span>
        </h1>
        {subline && (
          <p className="mt-[5px] font-mono text-[12px] tracking-[0.01em] text-muted-foreground">
            {subline}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-2.5">{actions}</div>
      )}
    </header>
  );
}
