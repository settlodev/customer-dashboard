"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { TaxType } from "@/types/tax-type/type";
import { accountingUrl } from "./accounting-client";

/**
 * Fetch the business's tax types from the Accounting Service.
 *
 * The accounting endpoint returns a plain {@code List<TaxTypeResponse>}
 * (no pagination wrapper), so callers get the raw array. The product
 * variant form uses these to populate its per-variant tax-type picker
 * and to resolve the default rate (code "A" / Standard Rate).
 */
export async function fetchAllTaxTypes(): Promise<TaxType[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl("/api/v1/tax-types"));
    return (parseStringify(data) as TaxType[]) ?? [];
  } catch {
    return [];
  }
}
