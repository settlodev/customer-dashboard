"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import type { FormResponse } from "@/types/types";
import type { SupplierNomination } from "@/types/supplier/nomination";
import { inventoryUrl } from "./inventory-client";

/**
 * Merchant-facing supplier nominations — a business submits one of its own
 * `Supplier` records for staff review to join the Settlo-approved directory.
 * Calls the Inventory Service's `supplier-nominations` API with the ambient
 * `X-Business-Id` header (attached by `ApiClient` for the "user" audience).
 * Authorization is `PERM_suppliers:read` (reads) / `PERM_suppliers:update`
 * (writes) on the caller's account.
 *
 * A nomination owned by another business is indistinguishable from one that
 * doesn't exist — the backend returns 404 for both, never 403 — by design,
 * so it never confirms the id exists elsewhere.
 */
function nominationsClient() {
  return new ApiClient("inventory");
}

const BASE = "/api/v1/supplier-nominations";

function revalidateSupplierSurfaces(supplierId?: string | null): void {
  revalidatePath("/suppliers");
  if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
}

// ── Reads ───────────────────────────────────────────────────────────

/**
 * All of the caller's nominations for one of their suppliers, newest first
 * (server's default order). Used to derive the "latest" nomination behind
 * the supplier detail page's financing card. Soft-fails to `[]` on any
 * non-boundary error (transient backend failure, etc.) so a card can just
 * fall back to "not submitted"; auth/permission errors still propagate to
 * the route error boundary.
 */
export async function getNominationsForSupplier(
  supplierId: string,
): Promise<SupplierNomination[]> {
  try {
    const params = new URLSearchParams({ sourceSupplierId: supplierId });
    const data = await nominationsClient().get<SupplierNomination[]>(
      inventoryUrl(`${BASE}?${params.toString()}`),
    );
    return parseStringify(data) ?? [];
  } catch (error) {
    rethrowIfBoundary(error);
    return [];
  }
}

// ── Mutations ───────────────────────────────────────────────────────

/**
 * Submit a supplier for Settlo review. The backend snapshots the supplier's
 * current contact/registration details server-side — this request only
 * carries the pointer plus an optional free-text note about the trading
 * relationship.
 *
 * A supplier already under review (or already linked) comes back as a 409
 * whose message ("This supplier is already under review", etc.) is surfaced
 * verbatim via `FormResponse.message`.
 */
export async function submitNomination(input: {
  sourceSupplierId: string;
  note?: string;
}): Promise<FormResponse<SupplierNomination>> {
  try {
    const body = {
      sourceSupplierId: input.sourceSupplierId,
      note: input.note?.trim() || undefined,
    };
    const data = await nominationsClient().post<SupplierNomination, typeof body>(
      inventoryUrl(BASE),
      body,
    );
    const saved = parseStringify(data) as SupplierNomination;
    revalidateSupplierSurfaces(saved.sourceSupplierId);
    return {
      responseType: "success",
      message: "Supplier submitted for review",
      data: saved,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to submit supplier for review",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/** Withdraw a nomination that's still under review. */
export async function withdrawNomination(
  id: string,
): Promise<FormResponse<SupplierNomination>> {
  try {
    const data = await nominationsClient().post<SupplierNomination, undefined>(
      inventoryUrl(`${BASE}/${id}/withdraw`),
      undefined,
    );
    const saved = parseStringify(data) as SupplierNomination;
    revalidateSupplierSurfaces(saved.sourceSupplierId);
    return {
      responseType: "success",
      message: "Nomination withdrawn",
      data: saved,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to withdraw nomination",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
