import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

const currencyCode = z
  .string()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter code")
  .transform((v) => v.toUpperCase());

export const CreateSupplierReturnItemSchema = z.object({
  stockVariantId: z
    .string({ required_error: "Stock item is required" })
    .min(1, "Stock item is required")
    .uuid("Stock item is required"),
  quantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Quantity is required" })
      .positive("Quantity must be greater than zero"),
  ),
  unitCost: z.preprocess(
    toNumber,
    z.number().nonnegative("Cost cannot be negative").optional(),
  ),
  currency: currencyCode.optional().or(z.literal("").transform(() => undefined)),
  reason: z.string().optional(),
  /**
   * Per-line tax override. Unset (`null`/undefined) means "use the stock
   * item's default" — see the resolution chain in
   * docs/superpowers/specs/2026-08-03-purchase-tax-design.md.
   */
  taxTypeId: z.string().uuid().optional().nullable(),
});

export const CreateSupplierReturnSchema = z.object({
  supplierId: z
    .string({ required_error: "Supplier is required" })
    .min(1, "Supplier is required")
    .uuid("Supplier is required"),
  grnId: z
    .string()
    .uuid("Invalid GRN reference")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reason: z
    .string({ required_error: "Reason is required" })
    .trim()
    .min(1, "Reason is required"),
  notes: z.string().optional(),
  /**
   * Document-level override: this return's unit costs are already
   * tax-inclusive — mirrors how the original purchase was priced.
   */
  pricesIncludeTax: z.boolean().optional().default(false),
  items: z.array(CreateSupplierReturnItemSchema).min(1, "Add at least one item"),
});
