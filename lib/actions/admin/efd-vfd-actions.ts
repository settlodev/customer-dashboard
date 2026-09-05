"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";

export interface VfdRegistrationStatusCheckResult {
  checked: number;
  verified: number;
}

/**
 * Forces the Accounting service's VFD registration-status scheduler to run
 * immediately instead of waiting for its 15-minute cron — re-attempts DIRM
 * authentication for every registration still externalStatus="Pending".
 */
export async function runVfdRegistrationStatusCheck(): Promise<
  FormResponse<VfdRegistrationStatusCheckResult>
> {
  try {
    const apiClient = new ApiClient("accounting", "staff");
    const data = await apiClient.post<
      VfdRegistrationStatusCheckResult,
      undefined
    >("/api/v1/admin/vfd/registrations/check", undefined);

    return parseStringify({
      responseType: "success",
      message:
        data.checked === 0
          ? "No pending registrations found."
          : `Checked ${data.checked} pending registration${data.checked === 1 ? "" : "s"} — ${data.verified} became active.`,
      data,
    });
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to run the VFD registration status check",
    });
  }
}
