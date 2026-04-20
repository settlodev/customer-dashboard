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

export const CreateLpoItemSchema = z.object({
  stockVariantId: z.string({ required_error: "Stock item is required" }).uuid(),
  orderedQuantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Ordered quantity is required" })
      .positive("Ordered quantity must be greater than zero"),
  ),
  unitCost: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Unit cost is required" })
      .nonnegative("Unit cost cannot be negative"),
  ),
  currency: currencyCode.optional().or(z.literal("").transform(() => undefined)),
});

export const CreateLpoSchema = z.object({
  supplierId: z.string({ required_error: "Supplier is required" }).uuid("Supplier is required"),
  notes: z.string().optional(),
  items: z.array(CreateLpoItemSchema).min(1, "Add at least one item"),
});

export const UpdateLpoStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
  ]),
});
