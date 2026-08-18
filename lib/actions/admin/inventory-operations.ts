"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

/**
 * Admin/ops: re-publish a location's product catalogue so the Reports Service
 * backfills its `dim_product` projection. One resync does BOTH in a single pass
 * — it re-publishes the full product, so Reports captures the category/department
 * taxonomy (powers the "Sales by category/department" reports) AND the product
 * images (`imageUrls`/variant `imageUrl` → top-selling-items thumbnails) from the
 * same PRODUCT_RESYNC event. Hits the inventory admin endpoint with the staff
 * token — it's gated on the internal admin permission, NOT the customer
 * `PERM_inventory:update`. Idempotent; safe to re-run.
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
      message: `Catalog resync started — ${n.toLocaleString()} product${n === 1 ? "" : "s"} queued. Reporting categories & product images will backfill.`,
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
 * is hidden for everyone else. Re-publishing the full product backfills the
 * Reports Service's `dim_product` — category/department taxonomy AND product
 * images — in one pass. Idempotent (re-upserts each product's single dim row),
 * so safe to re-run.
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
      message: `Platform-wide resync started — ${n.toLocaleString()} product${n === 1 ? "" : "s"} queued. Reporting categories & product images will backfill.`,
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
