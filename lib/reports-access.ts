/**
 * Dashboard reports permission model. The reports permission is split per
 * surface: the POS app gates on `reports:read_own` / `reports:read_all`, the
 * web dashboard gates ONLY on the `dashboard_reports` family below — so a
 * cashier can see their own report on the POS while the dashboard shows no
 * reports at all, and vice versa.
 */

/** Dashboard all-tier: every report page, location-wide (supersedes the rest). */
export const DASHBOARD_REPORTS_READ_ALL = "dashboard_reports:read_all";

/**
 * Dashboard own-tier: the own-scoped Sold-items report (the backend
 * force-scopes it to the caller's own data).
 */
export const DASHBOARD_REPORTS_READ_OWN = "dashboard_reports:read_own";

/**
 * Per-report dashboard keys — each unlocks exactly one report page (plus its
 * nav link), so a role can be given e.g. the Sales report but not the Stock
 * report. Keyed by the page's route. Keys mirror the Accounts catalog
 * (ids 411-422); the Reports Service accepts any of them as location-wide
 * authority — WHICH report they show is enforced here at page/nav level.
 */
export const REPORT_PAGE_PERMISSIONS: Readonly<Record<string, string>> = {
  "/report/sales": "dashboard_reports:sales",
  "/report/top-selling": "dashboard_reports:top_selling",
  "/report/sold-items": "dashboard_reports:sold_items",
  "/report/cashflow": "dashboard_reports:cashflow",
  "/report/credit": "dashboard_reports:credit",
  "/report/refunds": "dashboard_reports:refunds",
  "/report/voids": "dashboard_reports:voids",
  "/report/tax": "dashboard_reports:tax",
  "/report/stock": "dashboard_reports:stock",
  "/report/packaging": "dashboard_reports:packaging",
  "/report/staff": "dashboard_reports:staff",
  "/report/expense": "dashboard_reports:expense",
};

/**
 * The any-of permission set that unlocks a report page: the all-tier, the
 * page's own per-report key, and — for Sold-items only — the own-tier (which
 * shows it own-scoped). Used both for the nav item tags (sidebar `canSee`)
 * and the server-side page guard, so the two can never disagree.
 */
export function reportPagePermissions(link: string): string[] {
  const keys = [DASHBOARD_REPORTS_READ_ALL];
  const specific = REPORT_PAGE_PERMISSIONS[link];
  if (specific) keys.push(specific);
  if (link === "/report/sold-items") keys.push(DASHBOARD_REPORTS_READ_OWN);
  return keys;
}
