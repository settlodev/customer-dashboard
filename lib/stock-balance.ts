import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { Stock, StockWithBalance } from "@/types/stock/type";

/**
 * How the dashboard must read a stock variant that has no inventory balance
 * row at the current destination.
 *
 * A variant only gets an `inventory_balances` row when it is created (seeding
 * on creation started 2026-07-21, on draft publish 2026-08-18) or when it
 * first receives stock — so anything onboarded before then and never received
 * carries none. The service defines that absence as a zero balance:
 * `PosCatalogService` and `ProductAvailabilityService` both report
 * `remaining = 0` for a variant with no row, and `InventoryService.ensureBalance`
 * exists to make that answer addressable, not to change it.
 *
 * The dashboard honoured only half of it. `bal?.quantityOnHand ?? 0` made a
 * missing row read as 0 on hand, while `bal?.outOfStock` left the flag
 * `undefined` — falsy — so an item that had never been received showed "0" and
 * counted as in stock at the same time: black quantity, no warning icon, no row
 * in any out-of-stock reading. Since an item with no balance row is also an
 * item with no batch, "no batch, reads 0, still in stock" was the shape it took
 * in the wild. Every reader now goes through here, so absence reads as zero on
 * both halves.
 *
 * Takes the flag structurally rather than a whole balance, so it serves both
 * the Inventory Service's `InventoryBalance` and the Reports Service's
 * narrower `InventoryBalanceSummary` — a variant with no row has neither.
 */
export function isOutOfStock(
  balance: Pick<InventoryBalance, "outOfStock"> | null | undefined,
): boolean {
  return balance?.outOfStock ?? true;
}

/**
 * Roll a stock item's variant balances up into the totals and the two status
 * flags the stock table renders.
 *
 * Both flags are ANY-semantics over the variants, which is the rule the list
 * has always used: one variant out of stock colours the item's quantity red.
 * A variant with no balance counts as out (see {@link isOutOfStock}) unless it
 * is archived — a retired variant must not be able to redden a live item, and
 * it is the one case where "no row" carries no claim about what is on the
 * shelf.
 */
export function rollUpBalances(
  stock: Stock,
  balancesByVariantId: Map<string, InventoryBalance>,
): StockWithBalance {
  let totalQuantity = 0;
  let totalValue = 0;
  let lowStock = false;
  let outOfStock = false;

  for (const variant of stock.variants) {
    const bal = balancesByVariantId.get(variant.id);
    if (bal) {
      totalQuantity += bal.quantityOnHand;
      totalValue += bal.quantityOnHand * (bal.averageCost ?? 0);
      if (bal.lowStock) lowStock = true;
      if (bal.outOfStock) outOfStock = true;
    } else if (!variant.archived) {
      outOfStock = true;
    }
  }

  return { ...stock, totalQuantity, totalValue, lowStock, outOfStock };
}
