"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

/**
 * Admin/ops: re-publish a location's product catalogue so the Reports Service
 * backfills `dim_product.categories` (powers the "Sales by category/department"
 * reports). Hits the inventory admin endpoint with the staff token — it's gated
 * on the internal admin permission, NOT the customer `PERM_inventory:update`.
 * Idempotent; safe to re-run.
 */
export async function resyncLocationCatalog(
  locationId: string,
): Promise<FormResponse<{ count: number }>> {
  try {
    const count = await new ApiClient("inventory", "staff").post<
      number,
      Record<string, never>
    >(`/api/v1/admin/locations/${locationId}/products/resync`, {});

    const n = Number(count ?? 0);
    revalidatePath("/admin/locations");
    return parseStringify({
      responseType: "success",
      message: `Catalog resync started — ${n.toLocaleString()} product${n === 1 ? "" : "s"} queued.`,
      data: { count: n },
    });
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to resync catalog",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Admin/ops: re-publish EVERY location's catalogue platform-wide. Heavy — the
 * backend gates it on `ROLE_SYSTEM_ADMIN` (super admins only), and the button
 * is hidden for everyone else. Idempotent (re-upserts each product's single
 * dim row), so safe to re-run.
 */
export async function resyncAllCatalogs(): Promise<
  FormResponse<{ count: number }>
> {
  try {
    const count = await new ApiClient("inventory", "staff").post<
      number,
      Record<string, never>
    >(`/api/v1/admin/products/resync-all`, {});

    const n = Number(count ?? 0);
    revalidatePath("/admin/locations");
    return parseStringify({
      responseType: "success",
      message: `Platform-wide resync started — ${n.toLocaleString()} product${n === 1 ? "" : "s"} queued.`,
      data: { count: n },
    });
  } catch (error: unknown) {
    return parseStringify({
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to resync all catalogs",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
