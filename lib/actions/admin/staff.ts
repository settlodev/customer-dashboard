"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { AdminStaffSummary } from "@/types/admin/staff";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

/**
 * Look up a single staff member by id via the Accounts admin endpoint
 * `GET /api/v1/admin/staff/{staffId}`.
 *
 * Best-effort: returns `null` on any error (404, network, endpoint not yet
 * deployed, etc.) so callers can fall back gracefully without blocking the UI.
 */
export async function getAdminStaff(
  staffId: string,
): Promise<AdminStaffSummary | null> {
  try {
    const data = await staffClient().get<AdminStaffSummary>(
      `/api/v1/admin/staff/${encodeURIComponent(staffId)}`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}
