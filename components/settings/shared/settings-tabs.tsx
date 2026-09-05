/**
 * Tab styling for the settings screens that group sub-surfaces behind tabs
 * (Reservations, Integrations). Shared so the pill row reads the same on both
 * and follows the theme tokens rather than hardcoded white / gray-800.
 */

export const settingsTabsListClass =
  "inline-flex w-full max-w-2xl gap-1 overflow-x-auto rounded-lg border border-line bg-canvas p-1 no-scrollbar";

export const settingsTabTriggerClass =
  "min-w-0 flex-1 gap-1.5 rounded-md text-[12.5px] font-medium text-ink-2 transition data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm sm:text-[13px]";
