/** The business-permission key that grants location-wide (all-staff) reports. */
export const REPORTS_READ_ALL = "reports:read_all";

/**
 * Report nav links that show ALL-staff / all-location data and therefore
 * require `reports:read_all`. Hidden from a read_own user's nav and guarded
 * at the page. Everything NOT here (the Dashboard home + the Sold-items
 * report, which the backend force-scopes to the user's own data) stays.
 */
export const LOCATION_WIDE_REPORT_LINKS: readonly string[] = [
  "/report/sales",
  "/report/cashflow",
  "/report/top-selling",
  "/report/credit",
  "/report/refunds",
  "/report/voids",
  "/report/stock",
  "/report/staff",
  "/report/expense",
];
