import type {
  ArchiveReason,
  DestinationType,
  TaxClass,
  LifecycleStatus,
  PricingStrategy,
  StockLinkType,
  SelectionType,
} from "@/types/catalogue/enums";

// ── Product ─────────────────────────────────────────────────────────

export interface Product {
  id: string;
  locationType: DestinationType;
  locationId: string;
  name: string;
  slug: string;
  // ISO-4217 currency code shared by every variant of this product.
  nativeCurrency: string;
  description: string | null;
  imageUrl: string | null;
  sellOnline: boolean;
  trackStock: boolean;
  taxInclusive: boolean;
  taxClass: TaxClass | null;
  active: boolean;
  archivedAt: string | null;
  /**
   * Why this product was archived (paired with {@link archivedAt}). Null
   * for live products and rows archived before V36.
   */
  archivedReason: ArchiveReason | null;
  lifecycleStatus: LifecycleStatus;
  replacementProductId: string | null;
  tags: string[];
  categories: CategoryInfo[];
  departmentId: string | null;
  departmentName: string | null;
  brandId: string | null;
  brandName: string | null;
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  addonGroups: AddonGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

// ── Product Variant ─────────────────────────────────────────────────

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  displayName: string;
  slug: string;
  sku: string | null;
  /**
   * Optional barcode. Merchant-entered or auto-generated via
   * `POST /api/v1/product-barcodes/variants/{id}`. Unique across the
   * location when non-null.
   */
  barcode: string | null;
  imageUrl: string | null;
  pricingStrategy: PricingStrategy;
  price: number;
  nativeCurrency: string;
  markupPercentage: number | null;
  markupAmount: number | null;
  active: boolean;
  archivedAt: string | null;
  /**
   * Why this variant was archived. SOLD_OUT means the order consumer
   * auto-retired it once its stock hit zero (only fires when
   * autoRetireOnSellout is true). MERCHANT_ACTION means the merchant
   * archived it manually. Null for live variants and rows archived
   * before V36.
   */
  archivedReason: ArchiveReason | null;
  /**
   * When true, the order consumer auto-archives this variant the moment
   * its on-hand inventory hits zero. For unique / one-off items the
   * merchant never plans to restock.
   */
  autoRetireOnSellout: boolean;
  unlimited: boolean;
  costPrice: number | null;
  availableQuantity: number | null;
  inStock: boolean;
  stockLinkType: StockLinkType | null;
  stockVariantId: string | null;
  stockVariantName: string | null;
  directQuantity: number | null;
  /**
   * Live unit cost as of the read. The inventory service joins the matching
   * `inventory_balance` row server-side for DIRECT-linked variants
   * (`(currentBatchCost ?? averageCost) * directQuantity`); UNLIMITED and
   * recipe-linked variants — and DIRECT variants without a balance row yet
   * — fall back to the merchant-set `costPrice`. Read this directly in
   * list rows; do NOT re-derive from `getBalancesByLocation`.
   */
  currentCost: number | null;
  /**
   * Live sellable quantity as of the read. Populated only for
   * DIRECT-linked variants (`floor((onHand - reserved) / directQuantity)`).
   * Null for UNLIMITED variants (the row should fall back to
   * `unlimited`/`availableQuantity`) and for recipe-linked variants
   * (computing those requires walking the BOM rule, intentionally deferred).
   */
  qtyAvailable: number | null;
  currencyPriceOverrides: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// Sellability mode — derived UI concept, not a backend field.
// Maps to a (trackStock, unlimited, stockLinkType, availableQuantity) tuple:
//   UNLIMITED → trackStock=false, unlimited=true,  stockLinkType=null
//   QUANTITY  → trackStock=false, unlimited=false, stockLinkType=null, availableQuantity=N
//   DIRECT    → trackStock=true,  unlimited=false, stockLinkType="DIRECT", stockVariantId+directQuantity set
//   RECIPE    → trackStock=true,  unlimited=false, stockLinkType=null  (BOM rule resolves at sale time)
export type SellabilityMode = "UNLIMITED" | "QUANTITY" | "DIRECT" | "RECIPE";

// Modifier options use the same trio as variants minus QUANTITY — there's
// no merchant-set counter for modifier add-ons; their availability follows
// the linked stock item or recipe.
export type ModifierSellabilityMode = "UNLIMITED" | "DIRECT" | "RECIPE";

// ── Modifier Groups ─────────────────────────────────────────────────

// Modifier groups are business-scoped library entities. They get attached
// to one or more products via /products/{id}/modifier-groups/{groupId}.
export interface ModifierGroup {
  id: string;
  businessId: string;
  name: string;
  selectionType: SelectionType;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  active: boolean;
  options: ModifierOption[];
  archivedAt: string | null;
  /** Number of distinct products this group is currently attached to.
   *  Backend returns null when not asked for it; treat as unknown. */
  attachedProductCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  // Mirrors the variant tracking trio (no QUANTITY here — see
  // ModifierSellabilityMode). RECIPE-mode options carry the mode label
  // even though their direct fields are null — the actual recipe lives
  // in a bom_rules row keyed on this option's id.
  sellabilityMode: ModifierSellabilityMode;
  stockVariantId: string | null;
  stockVariantName: string | null;
  directQuantity: number | null;
  sortOrder: number;
  active: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Addon Groups ────────────────────────────────────────────────────

// Addon groups are business-scoped library entities. They get attached to
// one or more products via /products/{id}/addon-groups/{groupId}.
export interface AddonGroup {
  id: string;
  businessId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  active: boolean;
  items: AddonGroupItem[];
  archivedAt: string | null;
  /** Number of distinct products this group is currently attached to. */
  attachedProductCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddonGroupItem {
  id: string;
  addonGroupId: string;
  productVariantId: string;
  productVariantName: string;
  productVariantDisplayName: string;
  price: number;
  priceOverride: number | null;
  isDefault: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Product list row (one row per variant) ───────────────────────────

/**
 * The products list flattens each product into one row per active variant
 * — mirroring the stock-variant convention. Each row carries a readable
 * {@code displayName} (e.g. "Coca-Cola 300ml") plus the inventory-derived
 * cost and sellable quantity for that specific variant.
 *
 * <p>Display name rules (handled in the page's {@code variantDisplayName}
 * helper):
 * <ul>
 *   <li>If the variant name equals the product name (case-insensitive) →
 *       just the product name, no repetition.</li>
 *   <li>If the product has a single variant whose name is the conventional
 *       {@code Default} placeholder → just the product name.</li>
 *   <li>If the variant name already contains the product name → use the
 *       variant name as-is.</li>
 *   <li>Otherwise → "{product name} {variant name}".</li>
 * </ul>
 *
 * <p>{@code id} is set to the parent {@code productId} so the existing
 * row-click navigation lands on {@code /products/{productId}} and the
 * action menu (which acts on the product, not the individual variant)
 * keeps working unchanged.
 */
export interface ProductVariantRow {
  // Navigation
  id: string;
  productId: string;
  variantId: string;

  // Display
  name: string;
  imageUrl: string | null;

  // Full product reference — used by the row-action menu (archive, delete)
  // which still operates at the product level.
  product: Product;

  // Hoisted variant fields for clean cell renderers.
  sku: string | null;
  price: number;
  nativeCurrency: string;
  unlimited: boolean;
  stockLinkType: StockLinkType | null;
  stockVariantId: string | null;
  directQuantity: number | null;
  costPrice: number | null;
  variantActive: boolean;
  variantArchivedAt: string | null;

  // Computed
  _currentCost: number | null;
  _sellableQty: number | "Unlimited" | null;
}

// ── Currency Price Override (per variant) ───────────────────────────

export interface PriceOverrideResponse {
  id: string;
  productVariantId: string;
  currency: string;
  price: number;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Reports — kept untouched. These DTOs come from the reports/orders
// service, not the inventory service, and are consumed by analytics
// widgets, sold-items reports, and dashboard summaries elsewhere in
// the app. Do not modify without a coordinated change there.

export interface TopSellingProduct {
  startDate: Date;
  endDate: Date;
  locationName: string;
  items: TopItems[];
  totalRevenue: number;
  totalQuantitySold: number;
  soldItemsReport: SoldItemsReport;
}

export interface TopItems {
  name: string;
  productName: string;
  variantName: string;
  categoryName: string;
  imageUrl: string;
  staffName: string;
  quantity: number;
  revenue: number;
  percentageOfTotal: number;
  averagePrice: number;
  latestSoldDate: Date;
  earliestSoldDate: Date;
}

export interface SoldItemsReport {
  locationName: string;
  startDate: Date;
  endDate: Date;
  items: SoldItem[];
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number | null;
  totalProfit: number;
  averageMargin: number;
}

export interface SoldItem {
  productName: string;
  variantName: string;
  categoryName: string;
  staffName: string;
  imageUrl: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  netProfit: number;
  margin: number;
  refundedQuantity: number;
  refundedPrice: number;
  netPrice: number;
  refundedCost: number;
  netQuantity: number;
  netCost: number;
  latestSoldDate: string;
  earliestSoldDate: string;
  discountIncludingOrderDiscountPortion: number;
}
