import { array, boolean, enum as zEnum, number, object, preprocess, string } from "zod";

export const INTAKE_PAYMENT_TERMS = ["CREDIT", "CASH", "BANK"] as const;
export type IntakePaymentTerms = (typeof INTAKE_PAYMENT_TERMS)[number];

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockIntakeRecordItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid("Stock item is required"),
  quantity: preprocess(toNumber, number({ required_error: "Quantity is required" }).positive("Must be greater than zero")),
  /**
   * Zero-cost intake is rejected: a batch received at 0 poisons weighted-average
   * cost and reports margin as pure profit. Operators recording free stock must
   * still enter what it is worth.
   */
  unitCost: preprocess(toNumber, number({ required_error: "Unit cost is required" }).positive("Unit cost must be greater than zero")),
  /**
   * Optional purchase pack the operator transacted in (e.g. "Crate" while the
   * variant is tracked in "Bottle"). When set, `quantity` and `unitCost` are
   * interpreted in this unit and the backend converts to stock units using a
   * configured unit_conversion. Empty string is normalized to undefined so
   * existing forms that omit the field stay valid.
   */
  purchaseUnitId: preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    string().uuid().optional().nullish(),
  ),
  currency: string().length(3, "Use a 3-letter ISO currency code").optional().nullish(),
  batchNumber: string().optional().nullish(),
  expiryDate: string().optional().nullish(),
  supplierBatchReference: string().optional().nullish(),
  notes: string().optional(),
  serialNumbers: array(string()).optional(),
  /**
   * Per-line tax override. Unset (`null`/undefined) means "use the stock
   * item's default" — see the resolution chain in
   * docs/superpowers/specs/2026-08-03-purchase-tax-design.md.
   */
  taxTypeId: string().uuid().optional().nullable(),
});

export const StockIntakeRecordSchema = object({
  notes: string().optional(),
  /**
   * Document-level override: this supplier's unit costs on this intake are
   * already tax-inclusive. A property of how the supplier invoices, not of
   * the goods.
   */
  pricesIncludeTax: boolean().optional().default(false),
  orderedDate: string({ required_error: "Date ordered is required" }).min(1, "Date ordered is required"),
  receivedDate: string({ required_error: "Date received is required" }).min(1, "Date received is required"),
  supplierId: preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    string().uuid().optional().nullish(),
  ),
  supplierReference: string().max(100, "Max 100 characters").optional().nullish(),
  /**
   * How this intake was paid for. Drives the credit side of the
   * inventory-receipt journal in accounting: CREDIT → A/P, CASH →
   * Cash on Hand, BANK → Bank Primary.
   *
   * Defaults to CASH — an intake nobody edited means paid on receipt.
   * Defaulting to CREDIT accrued A/P the merchant did not owe.
   */
  paymentTerms: zEnum(INTAKE_PAYMENT_TERMS).default("CASH"),
  items: array(StockIntakeRecordItemSchema).min(1, "At least one item is required"),
});
