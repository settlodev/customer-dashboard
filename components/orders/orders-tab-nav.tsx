import Link from "next/link";

import { cn } from "@/lib/utils";

export type OrdersTab = "orders" | "abandoned";

interface Props {
  active: OrdersTab;
  /** Preserved when switching tabs so date / search context isn't lost. */
  preservedParams: Record<string, string | undefined>;
  /**
   * Base path the tab links point at. Defaults to the standalone Orders
   * page; the per-table Sales tab passes its own `/tables/{id}` route so
   * the same nav can drive an Orders/Abandoned split scoped to a table.
   */
  basePath?: string;
  /**
   * Query param that carries the active tab. Defaults to `tab` (the
   * Orders page). The Sales tab uses a distinct key (`view`) so it
   * doesn't collide with the table detail's own `tab` param.
   */
  paramKey?: string;
}

const TABS: Array<{ key: OrdersTab; label: string }> = [
  { key: "orders", label: "Orders" },
  { key: "abandoned", label: "Abandoned" },
];

/**
 * URL-driven tab nav. Switching tabs only flips the tab query param —
 * date range, search, and status filters carry over so the user can
 * jump between Active and Abandoned views without resetting context.
 *
 * `page` is intentionally dropped because the two tabs back different
 * data sets; whatever offset was valid on one tab won't be on the other.
 */
export function OrdersTabNav({
  active,
  preservedParams,
  basePath = "/orders",
  paramKey = "tab",
}: Props) {
  const buildHref = (tab: OrdersTab) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      if (v && k !== "page" && k !== paramKey) qs.set(k, v);
    }
    if (tab !== "orders") qs.set(paramKey, tab);
    const query = qs.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <div
      role="tablist"
      aria-label="Orders view"
      className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={buildHref(t.key)}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground/80",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
