import { array, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const OpeningStockItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid(),
  quantity: preprocess(toNumber, number({ required_error: "Quantity is required" }).positive("Must be positive")),
  unitCost: preprocess(toNumber, number({ required_error: "Unit cost is required" }).nonnegative("Cannot be negative")),
  batchNumber: string().optional().nullish(),
  expiryDate: string().optional().nullish(),
  supplierBatchReference: string().optional().nullish(),
  notes: string().optional(),
});

export const OpeningStockSchema = object({
  notes: string().optional(),
  items: array(OpeningStockItemSchema).min(1, "At least one item is required"),
});
