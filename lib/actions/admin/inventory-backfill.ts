"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

/**
 * Inventory Service backfills for event-sourced analytics — same purpose as
 * the Accounts-side republishes: entities and balances that predate Reports'
 * consumers (or arrived via the legacy data migration) are invisible there
 * until their events are re-emitted. All idempotent; none send email.
 */
function inventoryClient() {
  return new ApiClient("inventory", "staff");
}

async function run(
  path: string,
  noun: string,
  count: (result: unknown) => number,
): Promise<FormResponse<unknown>> {
  try {
    const result = await inventoryClient().post<unknown, Record<string, never>>(path, {});
    const n = count(result);
    revalidatePath("/admin/dashboard");
    return parseStringify({
      responseType: "success",
      message: `Queued ${n} ${noun} for re-emit — analytics catch up as the events drain (completion is logged server-side).`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || `Failed to republish ${noun}`,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/** Product catalogue → PRODUCT_RESYNC (dim_product / dim_product_variant). */
export async function republishAllProducts() {
  return run(`/api/v1/admin/products/resync-all`, "products", (r) =>
    typeof r === "number" ? r : 0,
  );
}

/** Stock catalogue → STOCK_ITEM_UPDATED (dim_stock / dim_stock_variant, nested variants). */
export async function republishAllStock() {
  return run(`/api/v1/admin/inventory/stock/republish-all`, "stock items", (r) =>
    Number((r as { stockItemsReemitted?: number })?.stockItemsReemitted ?? 0),
  );
}

/**
 * Live balances → INVENTORY_BALANCE_UPDATED (fact_inventory_current: the
 * dashboard's total inventory value / units). Follow with Reports'
 * sweep-stale-current once the events drain — see the reconciliation runbook.
 */
export async function republishAllBalances() {
  return run(`/api/v1/admin/inventory/balances/republish-all`, "balances", (r) =>
    Number((r as { balancesReemitted?: number })?.balancesReemitted ?? 0),
  );
}
