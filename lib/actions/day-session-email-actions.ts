"use server";

import ApiClient from "@/lib/settlo-api-client";
import type { FormResponse } from "@/types/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email a Close-of-Day summary. Delegates to the Accounts service, which owns
 * the one canonical templateData builder (shared with the auto-on-close email)
 * and publishes to Communications. No client-side snapshot/template assembly.
 */
export async function emailCloseOfDayReport(
  locationId: string,
  sessionId: string,
  recipients: string[],
  opts?: { businessDate?: string; identifier?: string; cc?: string[] },
): Promise<FormResponse> {
  const to = (recipients ?? []).map((r) => r.trim()).filter((r) => EMAIL_RE.test(r));
  if (to.length === 0) {
    return { responseType: "error", message: "Enter at least one valid email address." };
  }
  const cc = (opts?.cc ?? [])
    .map((r) => r.trim())
    .filter((r) => EMAIL_RE.test(r) && !to.includes(r));

  try {
    const accounts = new ApiClient(); // "accounts" + "user" audience (carries tenant headers)
    await accounts.post<void, { recipients: string[]; cc?: string[] }>(
      `/api/v1/locations/${locationId}/day-sessions/${sessionId}/email-report`,
      { recipients: to, ...(cc.length > 0 ? { cc } : {}) },
    );
    return {
      responseType: "success",
      message: `Summary queued for delivery to ${to.join(", ")}.`,
    };
  } catch (error) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to email the report.",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
