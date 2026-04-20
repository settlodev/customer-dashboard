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
  stockVariantId: z.string({ required_error: "Stock item is required" }).uuid(),
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
});

export const CreateSupplierReturnSchema = z.object({
  supplierId: z.string({ required_error: "Supplier is required" }).uuid(),
  grnId: z.string().uuid().optional().or(z.literal("")),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(CreateSupplierReturnItemSchema).min(1, "Add at least one item"),
});
