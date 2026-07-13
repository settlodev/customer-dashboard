/**
 * Shared URL helper + endpoint map for the borrower (customer-side) loan pages,
 * which talk to the Settlo Loan Management Service (LMS) — the same service the
 * admin console uses via `LOAN_MANAGEMENT_SERVICE_URL`.
 *
 * Mirrors `accounting-client.ts` / `inventory-client.ts`: server actions
 * prefix their requests with `loansUrl(path)` so the shared ApiClient sees a
 * full URL and skips its own service routing while still attaching auth +
 * tenant headers.
 *
 * ⚠️ The borrower endpoints below are still MOCK-backed. The LMS is live for the
 * admin console, but the borrower-facing endpoints in `LOAN_ENDPOINTS`
 * (eligibility, a "my loans" list, repayment) don't exist on it yet, so
 * `loans-actions.ts` returns typed mock data. To go live: wire those actions to
 * the real endpoints, then set `LOANS_BORROWER_BACKEND_READY=true`.
 */

const LOAN_SERVICE_URL = process.env.LOAN_MANAGEMENT_SERVICE_URL ?? "";

export function loansUrl(path: string): string {
  return `${LOAN_SERVICE_URL}${path}`;
}

/**
 * Whether the borrower pages call the real LMS instead of returning typed mock
 * data. Gated on an EXPLICIT opt-in — NOT merely the presence of the service URL
 * — because the LMS doesn't yet expose borrower-facing endpoints matching
 * `LOAN_ENDPOINTS`. Pointing the admin console at the LMS (setting
 * `LOAN_MANAGEMENT_SERVICE_URL`) must not silently flip the customer pages onto
 * endpoints that 404. Flip `LOANS_BORROWER_BACKEND_READY` on only after wiring
 * `loans-actions.ts` to the real endpoints.
 */
export const FINANCING_BACKEND_READY =
  Boolean(LOAN_SERVICE_URL) &&
  /^(1|true|yes|on)$/i.test(process.env.LOANS_BORROWER_BACKEND_READY ?? "");

/**
 * Card-scoped go-live flag for the pre-qualification eligibility summary ONLY. Separate from
 * FINANCING_BACKEND_READY because that gates the list/apply/pay actions too, whose borrower
 * endpoints aren't ready — flipping it globally would 404 those pages.
 */
export const ELIGIBILITY_BACKEND_READY =
  Boolean(LOAN_SERVICE_URL) &&
  /^(1|true|yes|on)$/i.test(process.env.LOANS_ELIGIBILITY_BACKEND_READY ?? "");

/** The endpoints the Financing service is expected to expose. */
export const LOAN_ENDPOINTS = {
  eligibility: "/api/v1/loans/eligibility",
  list: "/api/v1/loans",
  detail: (id: string) => `/api/v1/loans/${id}`,
  schedule: (id: string) => `/api/v1/loans/${id}/schedule`,
  apply: "/api/v1/loans/applications",
  pay: (id: string) => `/api/v1/loans/${id}/payments`,
} as const;
