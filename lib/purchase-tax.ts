import type { TaxType } from "@/types/tax-type/type";

/**
 * Three-tier purchase-tax-type resolution chain, shared by every
 * create-form preview on the dashboard (GRN, LPO, stock intake, supplier
 * return, RFQ quote). Mirrors the Inventory Service's `PurchaseTaxResolver`
 * exactly: line override → the stock item's own default tax type →
 * business default tax type (only when the business is VAT-registered) →
 * none.
 *
 * Originally written inline in the GRN form (the first of these forms to
 * ship); lifted here so the forms that came after it share one
 * implementation instead of five near-identical copies that could drift
 * out of sync with the server or each other.
 */
export function resolveEffectiveTaxTypeId(
  lineOverride: string | null | undefined,
  stockDefault: string | null | undefined,
  vatRegistered: boolean,
  businessDefaultTaxTypeId: string | null,
): string | null {
  return (
    lineOverride ??
    stockDefault ??
    (vatRegistered ? businessDefaultTaxTypeId : null) ??
    null
  );
}

/** The business's default tax type (`isDefault`) among the given (already active-filtered) list. */
export function findBusinessDefaultTaxTypeId(taxTypes: TaxType[]): string | null {
  return taxTypes.find((t) => t.isDefault)?.id ?? null;
}

/**
 * Two-tier "prices include tax" resolution, mirroring
 * `PurchaseTaxResolver:85-90` (Settlo Inventory Service): the document-level
 * flag wins when present; only when it's absent does the stock item's own
 * `purchaseTaxInclusive` default apply; absent both, exclusive (`false`).
 *
 * The dashboard always sends a concrete header boolean today (Fix 1,
 * 2026-08 fix wave) — populated from these same stock defaults by
 * {@link resolveHeaderPricesIncludeTaxDefault} — so on the happy path the
 * header tier always wins and this second tier never actually fires. It
 * exists so {@link computePurchaseTaxPreview} can't silently start lying
 * about the server's real behaviour if the header field ever becomes
 * optional/omissible on the wire again.
 */
export function resolvePricesIncludeTax(
  headerPricesIncludeTax: boolean | null | undefined,
  stockPurchaseTaxInclusive: boolean | null | undefined,
): boolean {
  return headerPricesIncludeTax ?? stockPurchaseTaxInclusive ?? false;
}

export interface HeaderPricesIncludeTaxDefault {
  pricesIncludeTax: boolean;
  /** True when the resolved lines disagree — the caller should surface a "lines differ" hint. */
  mixed: boolean;
}

/**
 * What the header "Supplier prices include tax" toggle should default to,
 * derived from the purchase-tax defaults of the stock items currently on
 * the document.
 *
 * Product owner decision (Fix 1, 2026-08 fix wave): reflect the item
 * default in the toggle — rather than always defaulting to `false` — so the
 * switch shows what the server will actually derive before the operator
 * touches it, and sending it explicitly is then correct because it matches
 * what `PurchaseTaxResolver` would have derived anyway. Callers should
 * apply this only while the toggle is "untouched" (the operator hasn't
 * manually flipped it), and re-run it whenever a line is added, removed, or
 * its stock variant changes.
 *
 * Only lines with a resolved stock default count; blank rows (no variant
 * picked yet) or rows still awaiting their catalogue fetch are ignored.
 * When the resolved lines disagree, default off and let the caller show a
 * hint instead of silently picking a side.
 */
export function resolveHeaderPricesIncludeTaxDefault(
  lineStockPurchaseTaxInclusive: Array<boolean | null | undefined>,
): HeaderPricesIncludeTaxDefault {
  const resolved = lineStockPurchaseTaxInclusive.filter(
    (v): v is boolean => typeof v === "boolean",
  );
  if (resolved.length === 0) {
    return { pricesIncludeTax: false, mixed: false };
  }
  const first = resolved[0];
  const mixed = resolved.some((v) => v !== first);
  return { pricesIncludeTax: mixed ? false : first, mixed };
}

/** A single line's inputs to the net/tax/gross preview. */
export interface PurchaseTaxPreviewLine {
  quantity: number;
  cost: number;
  /** This line's own tax-type override, if the operator picked one. */
  taxTypeOverride?: string | null;
  /** The stock item's own default tax type, resolved from its catalogue metadata. */
  stockDefaultTaxTypeId?: string | null;
  /**
   * The stock item's own `purchaseTaxInclusive` default — the preview's
   * second inclusive-chain tier. See {@link resolvePricesIncludeTax}.
   */
  stockPurchaseTaxInclusive?: boolean | null;
}

export interface PurchaseTaxPreviewTotals {
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  /**
   * `netAmount` when the tax is recoverable (VAT-registered business) — tax
   * is added on top. Otherwise `totalAmount`, because for a non-registered
   * business the tax is already folded into the entered cost and showing a
   * separate addition on screen would double-count it.
   */
  subtotal: number;
}

/**
 * Client-side net/tax/gross preview for a document being composed.
 *
 * These are create-only forms that redirect straight to a detail page on
 * success, so there is never a saved server response to read net/tax/gross
 * off of before submit — the preview is a client-side estimate. It mirrors
 * the server's exact arithmetic (`PurchaseTaxCalculator.compute` in the
 * Inventory Service) so it lines up with what the API will persist:
 * `rate` is a percent (divided by 100 here); when prices are tax-inclusive,
 * net is derived by division and tax by subtraction (`entered − net`, not
 * multiplication, so it reconstructs exactly); when exclusive, net is the
 * entered cost and tax is `net × rate`. The server's own figures remain
 * authoritative once the document is actually created.
 *
 * Lines with a non-positive quantity or cost are skipped — including
 * supplier-return lines where the operator left unit cost blank to fall
 * back to batch/average cost server-side, which the client has no way to
 * preview accurately.
 *
 * The "prices include tax" flag is resolved per line through the same
 * two-tier chain as the server (`params.pricesIncludeTax` header → this
 * line's `stockPurchaseTaxInclusive` → `false`; see
 * {@link resolvePricesIncludeTax}), not applied uniformly from the header
 * alone — so the preview stays correct even in states where the header
 * ends up unset.
 */
export function computePurchaseTaxPreview(
  lines: PurchaseTaxPreviewLine[],
  params: {
    pricesIncludeTax: boolean | null | undefined;
    vatRegistered: boolean;
    businessDefaultTaxTypeId: string | null;
    taxTypes: TaxType[];
  },
): PurchaseTaxPreviewTotals {
  const rateByTaxTypeId = new Map(params.taxTypes.map((t) => [t.id, t.ratePercent]));

  let netAmount = 0;
  let taxAmount = 0;
  for (const line of lines) {
    const qty = Number(line.quantity || 0);
    const cost = Number(line.cost || 0);
    if (qty <= 0 || cost <= 0) continue;

    const effectiveTaxTypeId = resolveEffectiveTaxTypeId(
      line.taxTypeOverride,
      line.stockDefaultTaxTypeId,
      params.vatRegistered,
      params.businessDefaultTaxTypeId,
    );
    const rate = effectiveTaxTypeId ? (rateByTaxTypeId.get(effectiveTaxTypeId) ?? 0) : 0;
    const r = rate / 100;

    const lineIncludesTax = resolvePricesIncludeTax(
      params.pricesIncludeTax,
      line.stockPurchaseTaxInclusive,
    );

    let netPerUnit: number;
    let taxPerUnit: number;
    if (lineIncludesTax) {
      netPerUnit = r > 0 ? cost / (1 + r) : cost;
      taxPerUnit = cost - netPerUnit;
    } else {
      netPerUnit = cost;
      taxPerUnit = cost * r;
    }

    netAmount += netPerUnit * qty;
    taxAmount += taxPerUnit * qty;
  }

  const totalAmount = netAmount + taxAmount;
  const subtotal = params.vatRegistered ? netAmount : totalAmount;
  return { netAmount, taxAmount, totalAmount, subtotal };
}
