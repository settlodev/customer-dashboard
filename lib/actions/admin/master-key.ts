"use server";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  MasterKeyResponse,
  StaffImpersonationTarget,
} from "@/types/admin/master-key";

const IMPERSONATION_PATH = "/auth/internal-admin/impersonation";
const BASE_PATH = `${IMPERSONATION_PATH}/master-key`;

function staffClient() {
  return new ApiClient("auth", "staff");
}

/**
 * Read the current master key.
 *
 * Deliberately NOT called during page render. Auth writes a `MASTER_KEY_VIEWED`
 * audit row on every call, so rendering it on load would stamp the trail on
 * every navigation and leave the key sitting on screen. The page reveals it
 * only on an explicit click, making one audit row per deliberate action.
 */
export async function revealMasterKey(): Promise<
  { ok: true; data: MasterKeyResponse } | { ok: false; message: string }
> {
  try {
    await requireOperatorPermission(PERM.USERS_IMPERSONATE_STAFF);
    const data = await staffClient().get<MasterKeyResponse>(BASE_PATH);
    if (!data?.key) {
      return {
        ok: false,
        message: "The auth service returned no key. Try rotating it.",
      };
    }
    return { ok: true, data: parseStringify(data) };
  } catch (error: any) {
    return { ok: false, message: readableError(error) };
  }
}

/**
 * Force an immediate rotation, invalidating the current key everywhere.
 *
 * This is the response to a suspected leak, not routine maintenance — the key
 * rotates on its own daily. Anyone mid-impersonation-flow with the old value
 * has to re-read the new one.
 */
export async function rotateMasterKey(): Promise<
  { ok: true; data: MasterKeyResponse } | { ok: false; message: string }
> {
  try {
    await requireOperatorPermission(PERM.USERS_IMPERSONATE_STAFF);
    const data = await staffClient().post<MasterKeyResponse, Record<string, never>>(
      `${BASE_PATH}/rotate`,
      {},
    );
    if (!data?.key) {
      return {
        ok: false,
        message: "Rotation succeeded but returned no key. Reveal it again.",
      };
    }
    return { ok: true, data: parseStringify(data) };
  } catch (error: any) {
    return { ok: false, message: readableError(error) };
  }
}

/**
 * Resolve a staff email to the identities it matches.
 *
 * Not audited — it is a lookup, not an impersonation, and recording every
 * search would bury the events that matter. An empty list is returned for both
 * "no such address" and "exists but not eligible", so the form can't be used to
 * probe which addresses are on the platform; the caller must render them alike.
 */
export async function findStaffTargets(
  email: string,
): Promise<
  { ok: true; targets: StaffImpersonationTarget[] } | { ok: false; message: string }
> {
  const trimmed = email.trim();
  if (!trimmed) return { ok: true, targets: [] };

  try {
    await requireOperatorPermission(PERM.USERS_IMPERSONATE_STAFF);
    const targets = await staffClient().get<StaffImpersonationTarget[]>(
      `${IMPERSONATION_PATH}/staff-targets?email=${encodeURIComponent(trimmed)}`,
    );
    return { ok: true, targets: parseStringify(targets ?? []) };
  } catch (error: any) {
    return { ok: false, message: readableError(error) };
  }
}

/**
 * The key is the one thing that must never end up in a log line or a toast, so
 * map upstream failures to fixed copy rather than echoing a response body.
 */
function readableError(error: any): string {
  const status = error?.status ?? error?.response?.status;
  if (status === 401) {
    return "Your operator session has expired. Sign in again to continue.";
  }
  if (status === 403) {
    return "Your role isn't permitted to read the impersonation master key.";
  }
  if (typeof error?.message === "string" && error.message.includes("permission")) {
    return error.message;
  }
  return "Couldn't reach the auth service. Try again, or contact engineering.";
}
