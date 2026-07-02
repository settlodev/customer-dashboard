/**
 * Shared URL helper + endpoint map for the (future) Financing service.
 *
 * Mirrors `accounting-client.ts` / `inventory-client.ts`: server actions
 * prefix their requests with `loansUrl(path)` so the shared ApiClient sees a
 * full URL and skips its own service routing while still attaching auth +
 * tenant headers.
 *
 * ⚠️ The financing backend does not exist yet. `loans-actions.ts` returns
 * typed mock data today; when the service ships, set `FINANCING_SERVICE_URL`
 * and replace each action's mock read with the `apiClient.<verb>(loansUrl(...))`
 * call already sketched in comments there — nothing else needs to change.
 */

const FINANCING_SERVICE_URL =
  process.env.FINANCING_SERVICE_URL ??
  process.env.ACCOUNTING_SERVICE_URL ??
  "";

export function loansUrl(path: string): string {
  return `${FINANCING_SERVICE_URL}${path}`;
}

/**
 * True once a dedicated Financing service URL is configured. The server
 * actions branch on this: when set, they hit the live endpoints; otherwise
 * they fall back to the typed mock. Gating on the *dedicated* env (not the
 * accounting fallback) means production doesn't accidentally route loan calls
 * to Accounting before the service exists.
 */
export const FINANCING_BACKEND_READY = Boolean(
  process.env.FINANCING_SERVICE_URL,
);

/** The endpoints the Financing service is expected to expose. */
export const LOAN_ENDPOINTS = {
  eligibility: "/api/v1/loans/eligibility",
  list: "/api/v1/loans",
  detail: (id: string) => `/api/v1/loans/${id}`,
  schedule: (id: string) => `/api/v1/loans/${id}/schedule`,
  apply: "/api/v1/loans/applications",
  pay: (id: string) => `/api/v1/loans/${id}/payments`,
} as const;
