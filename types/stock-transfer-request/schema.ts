import { array, number, object, preprocess, string, z } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const TransferRequestItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid(),
  requestedQuantity: preprocess(
    toNumber,
    number({ required_error: "Quantity is required" }).positive("Must be positive"),
  ),
  notes: string().optional(),
});

export const TransferRequestSchema = object({
  sourceLocationType: z.enum(["LOCATION", "WAREHOUSE", "STORE"], {
    required_error: "Source type is required",
  }),
  sourceLocationId: string({ required_error: "Source is required" }).uuid(),
  notes: string().optional(),
  items: array(TransferRequestItemSchema).min(1, "At least one item is required"),
});
