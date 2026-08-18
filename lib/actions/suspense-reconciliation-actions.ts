"use server";

import { rethrowIfBoundary } from "@/lib/list-fallback";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { SuspenseReconciliation } from "@/types/suspense-reconciliation/type";

import { accountingUrl } from "./accounting-client";

export async function getSuspenseReport(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<SuspenseReconciliation | null> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/chart-of-accounts/suspense-reconciliation/location/${locationId}?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getSuspenseReport failed", error);
    return null;
  }
}
