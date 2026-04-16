import type {
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
  description: string | null;
  imageUrl: string | null;
  sellOnline: boolean;
  trackStock: boolean;
  taxInclusive: boolean;
  taxClass: TaxClass | null;
  active: boolean;
  lifecycleStatus: LifecycleStatus;
  replacementProductId: string | null;
  tags: string[];
  categories: CategoryInfo[];
  departmentId: string | null;
  departmentName: string | null;
  brandId: string | null;
  brandName: string | null;
  variants: ProductVariant[];
  modifierGroups: ModifierGroupResponse[];
  addonGroups: AddonGroupResponse[];
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
  imageUrl: string | null;
  pricingStrategy: PricingStrategy;
  price: number;
  nativeCurrency: string;
  markupPercentage: number | null;
  markupAmount: number | null;
  active: boolean;
  unlimited: boolean;
  costPrice: number | null;
  availableQuantity: number | null;
  inStock: boolean;
  stockLinkType: StockLinkType | null;
  stockVariantId: string | null;
  stockVariantName: string | null;
  directQuantity: number | null;
  consumptionRuleId: string | null;
  consumptionRuleName: string | null;
  currencyPriceOverrides: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// ── Modifier Group ──────────────────────────────────────────────────

export interface ModifierGroupResponse {
  id: string;
  productId: string;
  name: string;
  selectionType: SelectionType;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  active: boolean;
  options: ModifierOptionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ModifierOptionResponse {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  stockVariantId: string | null;
  stockVariantName: string | null;
  stockQuantity: number | null;
  consumptionRuleId: string | null;
  consumptionRuleName: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Addon Group ─────────────────────────────────────────────────────

export interface AddonGroupResponse {
  id: string;
  productId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  active: boolean;
  items: AddonGroupItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AddonGroupItemResponse {
  id: string;
  addonGroupId: string;
  productVariantId: string;
  productVariantName: string;
  productVariantDisplayName: string;
  price: number;
  priceOverride: number | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Price Override ───────────────────────────────────────────────────

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

// ── Reports (kept from legacy — these come from a different service) ─

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
