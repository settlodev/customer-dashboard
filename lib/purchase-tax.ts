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

/** A single line's inputs to the net/tax/gross preview. */
export interface PurchaseTaxPreviewLine {
  quantity: number;
  cost: number;
  /** This line's own tax-type override, if the operator picked one. */
  taxTypeOverride?: string | null;
  /** The stock item's own default tax type, resolved from its catalogue metadata. */
  stockDefaultTaxTypeId?: string | null;
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
 */
export function computePurchaseTaxPreview(
  lines: PurchaseTaxPreviewLine[],
  params: {
    pricesIncludeTax: boolean;
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

    let netPerUnit: number;
    let taxPerUnit: number;
    if (params.pricesIncludeTax) {
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
