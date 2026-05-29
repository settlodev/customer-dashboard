import NoItems from "@/components/layouts/no-items";
import { StockLevelsTable } from "@/components/reports/stock/stock-levels-table";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import type { InventoryBalance } from "@/types/inventory-balance/type";

interface Props {
  asOf: string;
  page: number;
  limit: number;
  search: string;
  status: string;
}

type Status = "OUT" | "LOW" | "OVERSTOCK" | "OK" | "";

const deriveStatus = (b: InventoryBalance): Exclude<Status, ""> => {
  if (b.outOfStock) return "OUT";
  if (b.lowStock) return "LOW";
  if (b.overstock) return "OVERSTOCK";
  return "OK";
};

const matchesSearch = (b: InventoryBalance, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    b.variantName.toLowerCase().includes(needle) ||
    (b.stockName ?? "").toLowerCase().includes(needle)
  );
};

/**
 * Stock levels — every SKU's current quantity, reservation, and status.
 *
 * Server-side filters + slices the balance list before passing to the
 * client wrapper. The inventory-balance endpoint isn't paginated
 * server-side, so we paginate here over the filtered slice; this keeps
 * the client wrapper light and avoids a separate "fetch on tab switch"
 * round-trip per page.
 *
 * `asOf` is accepted for symmetry with the rest of the report but
 * currently routes to today's balances — historical-as-of is a future
 * enhancement that would key off `dim_inventory_snapshot`.
 */
export async function LevelsTab({ asOf: _asOf, page, limit, search, status }: Props) {
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

  const filtered = balances.filter((b) => {
    if (!matchesSearch(b, search)) return false;
    if (status && deriveStatus(b) !== status) return false;
    return true;
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  return (
    <StockLevelsTable
      data={pageData}
      pageCount={pageCount}
      pageNo={page - 1}
      total={total}
      currency={currency}
    />
  );
}
