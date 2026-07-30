/**
 * Inventory-side grouping label for stock items. Deliberately NOT the
 * product `Category` (`@/types/category/type`) — product categories are
 * POS-facing and carry a department; these are flat, inventory-only, and
 * optional on a stock item.
 */
export interface StockCategory {
  id: string;
  locationId: string;
  name: string;
  description: string | null;
  /**
   * Gates assignment only — an inactive category is hidden from the stock
   * form picker and CSV import, but still shows on stock items already
   * carrying it and still appears in the list filter.
   */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
