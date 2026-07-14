/**
 * @/types/proforma/type
 *
 * Notes on changes:
 * - Dropped `import { UUID } from "node:crypto"`. It's a Node builtin and this
 *   type is consumed by client components. A UUID off the wire is a string.
 * - `proformaStatus` is now a real union. The old one was
 *   `"DRAFT" | "COMPLETED" | "CANCELLED" | string`, and the trailing `| string`
 *   collapses the whole union to `string` — no autocomplete, no exhaustiveness
 *   checking, and it silently permitted the `"CONFIRMED"` comparison in the
 *   invoice component even though the server sends `"AWAITING"`.
 * - Nullability now matches the payload: the discount amounts and customerTin
 *   come back as `null`, not `0` / `""`.
 */

export type ProformaStatus =
  | "DRAFT"
  | "AWAITING"
  | "CONFIRMED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export interface ProformaItem {
  id: string;
  productName: string;
  productVariantName: string | null;
  quantity: number;
  /** VAT-inclusive unit price. */
  unitPrice: number;
  /** VAT-exclusive unit price. */
  unitTaxExclusivePrice: number;
  /**
   * Optional server-computed line totals. Prefer these over multiplying
   * unit price by quantity — for a fiscal document you want the server's
   * rounding, not the client's float arithmetic.
   */
  lineTotal?: number | null;
  lineTaxExclusiveTotal?: number | null;
}

export interface Proforma {
  id: string;
  proformaNumber: string;
  proformaStatus: ProformaStatus;
  notes: string | null;

  // ── Money ──
  showTaxAmounts: boolean;
  taxExclusiveGrossAmount: number;
  taxAmount: number;
  grossAmount: number;
  netAmount: number;

  manualDiscountAmount: number | null;
  appliedDiscountAmount: number | null;
  totalDiscountAmount: number | null;
  appliedDiscountId: string | null;

  // ── Dates ──
  expiresAt: string | null;
  dateCreated: string;

  // ── Customer ──
  customer: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerEmail: string | null;
  customerPhoneNumber: string | null;
  customerCity: string | null;
  customerAddress: string | null;
  customerTin: string | null;

  // ── Issuing business / location ──
  businessName: string | null;
  locationId?: string;
  locationName: string | null;
  locationLogo: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationEmail: string | null;
  locationPhoneNumber: string | null;
  tinNumber?: string | null;

  items: ProformaItem[];
}

export const LOCKED_PROFORMA_STATUSES = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly ProformaStatus[];

export function isProformaEditable(status: ProformaStatus): boolean {
  return !LOCKED_PROFORMA_STATUSES.includes(
    status as (typeof LOCKED_PROFORMA_STATUSES)[number],
  );
}
