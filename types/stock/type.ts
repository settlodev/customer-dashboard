import type { MaterialType } from "@/types/catalogue/enums";

export interface Stock {
  id: string;
  name: string;
  description: string | null;
  baseUnitId: string;
  baseUnitName: string;
  baseUnitAbbreviation: string;
  divisibleUnitId: string | null;
  divisibleUnitName: string | null;
  divisibleUnitAbbreviation: string | null;
  divisibleUnitRatio: number | null;
  archived: boolean;
  materialType: MaterialType;
  /**
   * Optional stock category. Null when uncategorised. Distinct from
   * product categories — see `@/types/stock-category/type`. Optional on
   * read so response payloads that pre-date the feature still type-check.
   */
  categoryId?: string | null;
  categoryName?: string | null;
  /**
   * Tax type applied to this item's purchase documents (LPOs, GRNs,
   * stock intake). Null falls back to the business default, and only
   * for VAT-registered businesses. Optional on read so response
   * payloads that pre-date the feature still type-check.
   */
  taxTypeId?: string | null;
  /**
   * True when suppliers normally quote this item at a price that
   * already includes tax. Defaults to false server-side. Optional on
   * read for the same pre-existing-payload reason as {@link taxTypeId}.
   */
  purchaseTaxInclusive?: boolean;
  /**
   * Legacy single-image field. New rows return {@link imageUrls};
   * keep this around for any callers still reading the cover via
   * the old shape.
   */
  imageUrl: string | null;
  /**
   * Up to 5 image URLs for the stock gallery. Element 0 is the
   * cover/thumbnail.
   */
  imageUrls: string[];
  variants: StockVariant[];
  /**
   * True when the stock item is an in-progress form save (V35). The
   * default catalog list excludes drafts; promote via the publish action.
   * Optional on read so older response payloads that pre-date V35 still
   * type-check.
   */
  draft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnableContainerLinkInput {
  /** Only present after a round-trip read. */
  id?: string;
  containerStockVariantId: string;
  containerName?: string;
  quantityPerUnit: number;
  depositValue?: number | null;
  depositCurrency?: string | null;
}

export interface StockVariant {
  id: string;
  stockId: string;
  name: string;
  displayName: string;
  sku: string | null;
  /**
   * Denormalized convenience copy of the parent stock's `baseUnitId` —
   * every variant of a stock transacts in the same tracking unit.
   */
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  divisibleUnitId: string | null;
  divisibleUnitName: string | null;
  divisibleUnitAbbreviation: string | null;
  divisibleUnitRatio: number | null;
  archived: boolean;
  isDefault: boolean;
  barcode: string | null;
  serialTracked: boolean;
  depositValue?: number | null;
  depositCurrency?: string | null;
  containerMode?: "RETURNABLE" | "CONSUMABLE" | null;
  returnableContainers?: ReturnableContainerLinkInput[];
  createdAt: string;
  updatedAt: string;
}

/** Stock enriched with aggregated inventory balance data */
export interface StockWithBalance extends Stock {
  totalQuantity: number;
  totalValue: number;
  lowStock: boolean;
  outOfStock: boolean;
}

