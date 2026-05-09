export interface ExpenseCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  code?: string | null;
  parentId?: string | null;
  chartOfAccountId?: string | null;
  active: boolean;
  /**
   * Optional. NULL = business-wide (visible at every location, the way
   * system-seeded rows live). Set when a merchant deliberately scopes
   * a category to one location.
   */
  locationId?: string | null;
  businessId: string;
  /**
   * True for the default catalogue planted by the accounting service
   * on a business's first LOCATION_CREATED. Surfaced as a "System"
   * badge in the picker; the merchant can still rename, re-parent, or
   * delete these.
   */
  systemSeeded: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
