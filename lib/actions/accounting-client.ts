/**
 * Shared URL helper for the Accounting Service.
 *
 * Mirrors `inventory-client.ts`: server actions prefix their requests with
 * this base so the shared ApiClient sees the full URL and skips its own
 * service routing while still attaching auth + tenant headers.
 */

const ACCOUNTING_SERVICE_URL = process.env.ACCOUNTING_SERVICE_URL ?? "";

export function accountingUrl(path: string): string {
  return `${ACCOUNTING_SERVICE_URL}${path}`;
}
