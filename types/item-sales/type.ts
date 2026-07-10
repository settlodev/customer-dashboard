export interface ItemSalesAggregate {
  productId: string;
  variantId: string;
  itemName: string;
  departmentName: string | null;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
}

export interface ItemSalesSummary {
  locationId: string;
  staffId: string | null;
  startDate: string;
  endDate: string;
  totalItemsSold: number;
  totalQuantitySold: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalDiscount: number;
  totalCost: number;
  totalGrossProfit: number;
  items: ItemSalesAggregate[];
}

// ── Sales by department (server-aggregated) ─────────────────────────
// Backed by the Reports Service, which groups fact_order_items by
// department in ClickHouse — the dashboard never loads every sold line
// item to aggregate it client-side.

/** One department's rollup row (the "By department" tab + detail totals). */
export interface DepartmentSalesRollup {
  /** Null for items with no department — rendered as "Unassigned". */
  departmentId: string | null;
  departmentName: string | null;
  /** Distinct products sold in the department. */
  products: number;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  grossProfit: number;
}

/** One sold item (product+variant) within a department. */
export interface DepartmentItemSale {
  productId: string;
  variantId: string;
  itemName: string;
  departmentName: string | null;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
}

export interface DepartmentItemSalesPage {
  content: DepartmentItemSale[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Department detail Sales tab payload: whole-period totals + one page of items. */
export interface DepartmentItemSalesResult {
  totals: DepartmentSalesRollup;
  items: DepartmentItemSalesPage;
}

/**
 * True location totals for the period (un-fanned). Category/department rollups
 * are multi-attributed (a product counts toward every category/department it
 * belongs to), so per-row sums can exceed net — the KPI strip uses these.
 */
export interface PeriodSalesTotals {
  quantitySold: number;
  grossSales: number;
  netSales: number;
  grossProfit: number;
}

/** "By department" rollup payload: true totals + one row per department. */
export interface DepartmentSalesRollupResult {
  totals: PeriodSalesTotals;
  departments: DepartmentSalesRollup[];
}

/** One category's rollup row (the "By category" tab + category detail totals). */
export interface CategorySalesRollup {
  categoryId: string | null;
  categoryName: string | null;
  products: number;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  grossProfit: number;
  taxAmount: number;
}

/** "By category" rollup payload: true totals + one row per category. */
export interface CategorySalesRollupResult {
  totals: PeriodSalesTotals;
  categories: CategorySalesRollup[];
}

/** Category detail Sales tab payload: the category's totals + one page of items. */
export interface CategoryItemSalesResult {
  totals: CategorySalesRollup;
  items: DepartmentItemSalesPage;
}
