/**
 * Server-computed pricing for a purchase document that has not been saved
 * yet — the response of `POST /api/v1/purchase-tax/preview` (Inventory
 * Service).
 *
 * These figures come from the same `PurchaseLinePricer` the save path runs,
 * so what the composer shows is what the API will persist. Everything is in
 * `currency` (the location's base currency) and in each variant's stock
 * unit — pack conversion and FX have already been applied.
 */
export interface PurchaseTaxPreviewLine {
  /** Position in the submitted list, for matching rows back up. */
  index: number;
  stockVariantId: string;
  stockVariantName?: string | null;
  /** Quantity in the variant's stock unit, after any pack conversion. */
  quantity?: number | null;
  /** Post-tax cost per stock unit: net when recoverable, gross when not. */
  unitCost?: number | null;
  netAmount?: number | null;
  /** Recoverable tax, charged on top of net. Zero otherwise. */
  taxAmount?: number | null;
  /** Tax already inside unitCost when it cannot be reclaimed. Memo only. */
  nonRecoverableTaxAmount?: number | null;
  totalAmount?: number | null;
  taxTypeId?: string | null;
  taxTypeName?: string | null;
  ratePercent?: number | null;
  taxRecoverable: boolean;
  pricesIncludeTax: boolean;
  originalCurrency?: string | null;
  rateUsed?: number | null;
  /**
   * Why this line could not be priced. Null on success. A failed line is
   * reported and skipped rather than failing the request — this is called
   * while the operator is still typing.
   */
  error?: string | null;
}

export interface PurchaseTaxPreview {
  currency: string;
  netAmount: number;
  taxAmount: number;
  nonRecoverableTaxAmount: number;
  totalAmount: number;
  /** Whether the business reclaims input VAT — drives how tax is labelled. */
  taxRecoverable: boolean;
  /** True when at least one line carries an `error` and was skipped. */
  partial: boolean;
  items: PurchaseTaxPreviewLine[];
}

/** One line as submitted for pricing. Mirrors the create-line shape. */
export interface PurchaseTaxPreviewLineInput {
  stockVariantId: string;
  quantity: number;
  unitCost: number;
  purchaseUnitId?: string | null;
  currency?: string | null;
  taxTypeId?: string | null;
}

export interface PurchaseTaxPreviewInput {
  /**
   * The document-level "supplier prices are gross" flag. Pass `null` to
   * mean "not stated" and let each stock item's own default decide —
   * sending `false` instead silently overrides that.
   */
  pricesIncludeTax?: boolean | null;
  items: PurchaseTaxPreviewLineInput[];
}
