import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

const toInt = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") {
    const n = parseInt(val, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof val === "number") return Math.trunc(val);
  return undefined;
};

const currencyCode = z
  .string()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code")
  .transform((v) => v.toUpperCase());

export const CreateRfqItemSchema = z.object({
  stockVariantId: z.string({ required_error: "Stock item is required" }).uuid(),
  requestedQuantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Requested quantity is required" })
      .positive("Quantity must be greater than zero"),
  ),
  targetUnitPrice: z.preprocess(
    toNumber,
    z.number().nonnegative("Cannot be negative").optional(),
  ),
  specifications: z.string().optional(),
});

export const CreateRfqSchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(1, "Title is required"),
  targetCurrency: currencyCode.optional().or(z.literal("").transform(() => undefined)),
  submissionDeadline: z.string().optional(),
  requiredByDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(CreateRfqItemSchema).min(1, "Add at least one item"),
  invitedSupplierIds: z.array(z.string().uuid()).optional(),
});

export const QuoteItemSchema = z.object({
  rfqItemId: z.string({ required_error: "RFQ item is required" }).uuid(),
  quotedUnitPrice: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Unit price is required" })
      .positive("Price must be greater than zero"),
  ),
  quotedQuantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Quantity is required" })
      .positive("Quantity must be greater than zero"),
  ),
  currency: currencyCode.optional().or(z.literal("").transform(() => undefined)),
  leadTimeDays: z.preprocess(
    toInt,
    z.number().int().nonnegative("Lead time cannot be negative").optional(),
  ),
  notes: z.string().optional(),
  /**
   * Per-line tax override. Unset (`null`/undefined) means "use the stock
   * item's default" — see the resolution chain in
   * docs/superpowers/specs/2026-08-03-purchase-tax-design.md.
   */
  taxTypeId: z.string().uuid().optional().nullable(),
});

export const SubmitQuoteSchema = z.object({
  supplierId: z.string({ required_error: "Supplier is required" }).uuid(),
  leadTimeDays: z.preprocess(
    toInt,
    z.number().int().nonnegative().optional(),
  ),
  currency: currencyCode.optional().or(z.literal("").transform(() => undefined)),
  paymentTerms: z.string().optional(),
  validityDate: z.string().optional(),
  notes: z.string().optional(),
  /**
   * Per-document override: this supplier's quote is priced gross
   * (tax-inclusive). Informational only — nothing posts to a ledger from a
   * quote; it exists so a gross-quoting supplier can be compared with a
   * net-quoting one on the same basis.
   */
  pricesIncludeTax: z.boolean().optional().default(false),
  items: z.array(QuoteItemSchema).min(1, "Add at least one line"),
});

export const AwardQuoteSchema = z.object({
  supplierQuoteId: z.string({ required_error: "Quote is required" }).uuid(),
});
