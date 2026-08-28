"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import type {
  NominationReview,
  NominationStatus,
} from "@/types/supplier/nomination";

/**
 * Admin (internal-ops) supplier nomination review queue — calls the
 * Inventory Service's `settlo-supplier-nominations` admin API with the
 * internal staff token. Tenant-agnostic (no `X-Business-Id`): staff triage
 * nominations across every business. Authorization is the Inventory
 * Service's server-side check on `internal:accounts:read:all` (reads) /
 * `internal:accounts:manage` (approve/reject), satisfied by the caller's
 * `internalPermissions` claim — see lib/admin/permissions.ts.
 */
function nominationsClient() {
  return new ApiClient("inventory", "staff");
}

const NOMINATIONS_PATH = "/api/v1/settlo-supplier-nominations";

function revalidateNominationSurfaces(id?: string): void {
  revalidatePath("/admin/settlo-suppliers/nominations");
  if (id) revalidatePath(`/admin/settlo-suppliers/nominations/${id}`);
}

/**
 * The review queue, optionally filtered by status. Note: the backend
 * defaults to `SUBMITTED` when `status` is omitted — it does not mean "all
 * statuses". Throws on any error, including transient backend failures —
 * the caller (the admin nominations page) must catch and render a distinct
 * failure state, since a swallowed error here would otherwise render as an
 * indistinguishable "no nominations to review" and let a real outage hide
 * behind an empty queue. Requires `internal:accounts:read:all`.
 */
export async function listNominations(
  status?: NominationStatus,
): Promise<NominationReview[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  const data = await nominationsClient().get<NominationReview[]>(
    qs ? `${NOMINATIONS_PATH}?${qs}` : NOMINATIONS_PATH,
  );
  return parseStringify(data) ?? [];
}

/**
 * A single nomination, with match candidates against the existing
 * directory, or `null` if it doesn't exist. Requires `internal:accounts:read:all`.
 */
export async function getNomination(
  id: string,
): Promise<NominationReview | null> {
  try {
    const data = await nominationsClient().get<NominationReview>(
      `${NOMINATIONS_PATH}/${id}`,
    );
    return parseStringify(data);
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

/**
 * Approve a nomination, either minting a new directory entry (`CREATE`) or
 * linking it to an existing one (`MATCH`, requires `settloSupplierId`).
 * Requires `internal:accounts:manage`.
 */
export async function approveNomination(
  id: string,
  input: { mode: "CREATE" | "MATCH"; settloSupplierId?: string },
): Promise<FormResponse<NominationReview>> {
  try {
    const result = await nominationsClient().post<
      NominationReview,
      typeof input
    >(`${NOMINATIONS_PATH}/${id}/approve`, input);
    revalidateNominationSurfaces(id);
    return parseStringify({
      responseType: "success",
      message:
        input.mode === "MATCH"
          ? "Nomination approved and matched to the existing supplier"
          : "Nomination approved — new directory entry created",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to approve nomination",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Reject a nomination with a required reason. Requires `internal:accounts:manage`. */
export async function rejectNomination(
  id: string,
  reason: string,
): Promise<FormResponse<NominationReview>> {
  const trimmed = reason.trim();
  if (!trimmed) {
    return {
      responseType: "error",
      message: "Please provide a reason for rejecting this nomination",
    };
  }
  try {
    const result = await nominationsClient().post<
      NominationReview,
      { reason: string }
    >(`${NOMINATIONS_PATH}/${id}/reject`, { reason: trimmed });
    revalidateNominationSurfaces(id);
    return parseStringify({
      responseType: "success",
      message: "Nomination rejected",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to reject nomination",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
