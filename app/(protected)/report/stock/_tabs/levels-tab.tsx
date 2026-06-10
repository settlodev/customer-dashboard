import NoItems from "@/components/layouts/no-items";
import { StockLevelsTable } from "@/components/reports/stock/stock-levels-table";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";

/**
 * Stock levels — every SKU's current quantity, reservation, and status.
 *
 * The inventory-balance endpoint returns the whole per-location balance set
 * in a single call, so we hand it straight to the table, which paginates,
 * searches, and filters by status client-side over the full set. That keeps
 * the status filter honest (it spans every row, not just the visible page)
 * and avoids re-fetching all balances on each page/search change.
 *
 * Historical "as of" is a future enhancement that would key off
 * `dim_inventory_snapshot`; today's view always reflects current balances.
 */
export async function LevelsTab() {
  const location = await getCurrentLocation();
  const locationId = location?.id ?? null;

  const [currency, balances] = await Promise.all([
    getLocationCurrency(),
    locationId
      ? getBalancesByLocation(locationId)
      : Promise.resolve<InventoryBalance[]>([]),
  ]);

  if (balances.length === 0) {
    return <NoItems itemName="stock items" />;
  }

  return <StockLevelsTable data={balances} currency={currency} />;
}
