"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { PublicMonthlyProfitLoss } from "@/types/reports/type";

const PUBLIC_BASE = "/api/v1/public/reports/profit-and-loss";

/**
 * Unauthenticated lookup of a frozen month-end statement by its share
 * token — the link in the monthly P&L email. Mirrors the Close-of-Day
 * share action: plain request, no session, the opaque token is the only
 * credential. Returns null for an unknown token so the page can 404.
 */
export async function getPublicMonthlyProfitLoss(
  token: string,
): Promise<PublicMonthlyProfitLoss | null> {
  try {
    const apiClient = new ApiClient("accounting");
    apiClient.isPlain = true;
    const data = await apiClient.get<PublicMonthlyProfitLoss>(
      `${PUBLIC_BASE}/${encodeURIComponent(token)}`,
    );
    return data ? (parseStringify(data) as PublicMonthlyProfitLoss) : null;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}
