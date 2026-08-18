import type { DestinationType } from "@/types/catalogue/enums";

/**
 * A bundle of product variants sold together at one price. The default
 * bundle price is the sum of each item's `unitPrice × quantity` in the
 * collection's `nativeCurrency`. Setting `customPrice` overrides that
 * sum (typically a promotional discount, but a premium is allowed too).
 * Per-currency overrides on `currencyOverrides` pin a specific bundle
 * price for non-native currencies — otherwise the till FX-converts the
 * native effective price at sale time.
 */
export interface ProductCollection {
  id: string;
  locationType: DestinationType;
  locationId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  archivedAt: string | null;

  /** ISO-4217 code that `defaultPrice` / `customPrice` / `effectivePrice` are expressed in. */
  nativeCurrency: string;
  /** Sum of `items[].lineTotal` — what the bundle would cost at native variant prices. */
  defaultPrice: number;
  /** Merchant override; `null` when the bundle defaults to the sum. */
  customPrice: number | null;
  /** Price actually charged in `nativeCurrency`: `customPrice` when set, else `defaultPrice`. */
  effectivePrice: number;
  /** All variants in stock for their required quantities. */
  sellable: boolean;
  itemCount: number;
  items: CollectionItem[];
  currencyOverrides: CollectionPrice[];

  createdAt: string;
  updatedAt: string;
}

/** One sellable variant line inside a bundle, with the qty required for one bundle sale. */
export interface CollectionItem {
  variantId: string;
  productId: string | null;
  productName: string | null;
  variantName: string | null;
  variantDisplayName: string | null;
  productImageUrl: string | null;
  variantImageUrl: string | null;
  variantActive: boolean | null;
  quantity: number;
  /** Variant's native unit price at fetch time. */
  unitPrice: number | null;
  unitCurrency: string | null;
  /** `unitPrice × quantity` — the line's contribution to `defaultPrice`. */
  lineTotal: number;
  sortOrder: number;
}

/** Per-currency bundle price override (mirrors product-variant currency overrides). */
export interface CollectionPrice {
  id: string;
  currency: string;
  price: number;
  active: boolean;
  notes: string | null;
}
