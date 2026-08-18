import { z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const CreateRequisitionItemSchema = z.object({
  stockVariantId: z.string({ required_error: "Stock item is required" }).uuid(),
  requestedQuantity: z.preprocess(
    toNumber,
    z
      .number({ required_error: "Requested quantity is required" })
      .positive("Quantity must be greater than zero"),
  ),
  estimatedUnitCost: z.preprocess(
    toNumber,
    z.number().nonnegative("Cost cannot be negative").optional(),
  ),
  preferredSupplierId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const CreateRequisitionSchema = z.object({
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  requiredByDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(CreateRequisitionItemSchema).min(1, "Add at least one item"),
});

export const RejectRequisitionSchema = z.object({
  reason: z
    .string({ required_error: "Reason is required" })
    .min(1, "Reason is required"),
});
