"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { WhitelabelSummary } from "@/types/admin/billing";

interface RawWhitelabelApp {
  id: string;
  name: string;
  code: string;
  active?: boolean;
}

function staffAccounts() {
  return new ApiClient("accounts", "staff");
}

/**
 * Cross-tenant list of whitelabel apps for admin pickers. Lives in the
 * Accounts Service so we go there directly rather than proxying through
 * Billing. Returns a minimal summary to keep the dropdown payload
 * small — pickers don't need timestamps, slugs, or client IDs.
 */
export async function listWhitelabels(): Promise<WhitelabelSummary[]> {
  const data = await staffAccounts().get<RawWhitelabelApp[]>(
    "/api/v1/whitelabel-apps",
  );
  const items = parseStringify(data) as RawWhitelabelApp[];
  return items.map((w) => ({
    id: w.id,
    name: w.name,
    code: w.code,
    active: w.active !== false,
  }));
}
