import { array, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockIntakeRecordItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid(),
  quantity: preprocess(toNumber, number({ required_error: "Quantity is required" }).positive("Must be greater than zero")),
  unitCost: preprocess(toNumber, number({ required_error: "Unit cost is required" }).nonnegative("Cannot be negative")),
  currency: string().length(3, "Use a 3-letter ISO currency code").optional().nullish(),
  batchNumber: string().optional().nullish(),
  expiryDate: string().optional().nullish(),
  supplierBatchReference: string().optional().nullish(),
  notes: string().optional(),
  serialNumbers: array(string()).optional(),
});

export const StockIntakeRecordSchema = object({
  notes: string().optional(),
  orderedDate: string().optional().nullish(),
  receivedDate: string().optional().nullish(),
  supplierId: string().uuid().optional().nullish(),
  items: array(StockIntakeRecordItemSchema).min(1, "At least one item is required"),
});
