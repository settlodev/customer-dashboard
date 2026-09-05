/**
 * The customer detail page's tabs, carried on the URL as `?tab=` so the order
 * ledger's own `?page` / `?search` replaces never lose the active tab.
 *
 * Lives outside the client view on purpose: the server page parses the URL
 * with it, and a function exported from a `"use client"` module cannot be
 * called on the server.
 */
export type CustomerTab =
  | "orders"
  | "insights"
  | "balance"
  | "prepaid"
  | "profile";

export function parseCustomerTab(raw: string | undefined): CustomerTab {
  return raw === "insights" ||
    raw === "balance" ||
    raw === "prepaid" ||
    raw === "profile"
    ? raw
    : "orders";
}
