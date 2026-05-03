/**
 * Live inventory state — shape served by the Reports Service.
 *
 * Subset of {@link InventoryBalance}: covers what the dashboard needs to
 * render the current-state view (qty, value, alerts) but omits the
 * authoritative writeable config (reorder thresholds, alert flags,
 * preferred supplier) which still lives on the Inventory Service.
 *
 * Use this anywhere you only need to read the live balance — e.g. the
 * Inventory tab on the product detail page. Use {@link InventoryBalance}
 * (Inventory Service) when you also need to mutate or display reorder
 * configuration.
 */
export interface InventoryBalanceSummary {
  locationId: string;
  stockVariantId: string;
  stockId?: string | null;
  businessId?: string | null;
  locationType?: string | null;

  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  /** {@code quantityOnHand + inTransitQuantity}. */
  expectedQuantity: number;

  averageCost: number | null;
  /** {@code quantityOnHand × averageCost}, materialised on the fact. */
  onHandValue: number;

  lowStockThreshold: number | null;
  lowStock: boolean;
  outOfStock: boolean;

  occurredAt: string | null;
}
