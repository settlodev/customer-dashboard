"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ReferralAgentSelfResponse } from "@/types/referral-agent";

/**
 * Fetch the authenticated referral agent's own referral stats. The default
 * ApiClient targets the Accounts Service with the customer `authToken`; the
 * endpoint is gated to ROLE_REFERRAL_AGENT and resolves the caller via the JWT
 * subject, so no id is passed.
 */
export async function getMyReferralStats(): Promise<ReferralAgentSelfResponse> {
  const apiClient = new ApiClient();
  const data = await apiClient.get<ReferralAgentSelfResponse>(
    "/api/v1/referral-agent/me",
  );
  return parseStringify(data);
}
