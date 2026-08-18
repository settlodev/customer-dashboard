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
  /**
   * Legacy single-image field. New rows return {@link imageUrls};
   * keep this around for any callers still reading the cover via
   * the old shape.
   */
  imageUrl: string | null;
  /**
   * Up to 5 image URLs for the product gallery (V32). Element 0 is
   * the cover/thumbnail.
   */
  imageUrls: string[];
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
  /**
   * Weekly sellability windows. Empty (the default) means always
   * sellable. Non-empty scopes live-selling to the listed day/time
   * windows — see {@link SellableWindow}.
   */
  sellableWindows?: SellableWindow[];
  /**
   * Per-date overrides layered on top of {@link sellableWindows} — block
   * a specific holiday, or open for a one-off event outside the normal
   * windows. Empty (the default) means no overrides.
   */
  sellabilityExceptions?: SellabilityException[];
  // A product can roll up to several departments — one per category it
  // belongs to. Departments live on the category, not the product, so read
  // them off `categories[].departmentName` (see {@link CategoryInfo}) rather
  // than expecting a single product-level field.
  categories: CategoryInfo[];
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
  // Department this category rolls up to. Departments are a paid-tier
  // feature attached to categories; both fields are null when the category
  // has no department. `departmentName` is resolved server-side from the
  // location's DepartmentReference mirror, so it may be null if the mirror
  // hasn't synced the name yet even when `departmentId` is set.
  departmentId: string | null;
  departmentName: string | null;
}

// Product-level sellability schedule (see {@link Product.sellableWindows} /
// {@link Product.sellabilityExceptions}).
export type ProductDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface SellableWindow {
  dayOfWeek: ProductDayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm — endTime <= startTime is a valid overnight window
}

export interface SellabilityException {
  date: string; // YYYY-MM-DD
  mode: "BLOCKED" | "AVAILABLE";
  startTime?: string | null;
  endTime?: string | null;
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
  /** Give-away / free item (sells at 0, still tracked). Distinct from the comp tender. */
  giveaway: boolean;
  /**
   * Block-from-sale ("Unavailable today"). True blocks staff from selling
   * this variant without removing it from the menu. A product is fully
   * blocked only when every one of its variants carries saleLocked=true.
   */
  saleLocked?: boolean;
  unlimited: boolean;
  costPrice: number | null;
  availableQuantity: number | null;
  inStock: boolean;
  stockLinkType: StockLinkType | null;
  stockVariantId: string | null;
  stockVariantName: string | null;
  directQuantity: number | null;
  /** Unit the per-sale quantity is expressed in; the stock item's base unit by default. */
  saleUnitId: string | null;
  saleUnitName: string | null;
  saleUnitAbbreviation: string | null;
  /** The number the merchant typed, in `saleUnitId`. `directQuantity` is its base-unit equivalent. */
  saleUnitQuantity: number | null;
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
  /**
   * FK to a TaxType in the Accounting Service. Null means the order
   * calculator treats the line as exempt (zero-rate).
   */
  taxTypeId: string | null;
  /** Snapshot of the linked tax type's TRA code at read time, e.g. "A". */
  taxTypeCode: string | null;
  /** Snapshot of the display name, e.g. "Standard Rate (VAT 18%)". */
  taxTypeName: string | null;
  /** Snapshot of the rate, e.g. 18.0000. */
  taxRatePercent: number | null;
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
  /** Unit the per-sale quantity is expressed in; the stock item's base unit by default. */
  saleUnitId: string | null;
  saleUnitName: string | null;
  saleUnitAbbreviation: string | null;
  /** The number the merchant typed, in `saleUnitId`. `directQuantity` is its base-unit equivalent. */
  saleUnitQuantity: number | null;
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

// ── Reports — top-selling and sold-items were dropped from this file.
// Both have been redesigned and now live under `types/reports/`:
//   - types/reports/top-selling.ts
//   - types/reports/sold-items.ts
// No legacy types remain here.
