import { array, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockModificationItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid(),
  quantityChange: preprocess(
    toNumber,
    number({ required_error: "Quantity is required" }).refine(
      (n) => n !== 0,
      "Quantity change cannot be zero",
    ),
  ),
  // Optional override cost (e.g. insurance valuation), in the location's base
  // currency. If absent, the backend uses the variant's average cost.
  unitCost: preprocess(toNumber, number().nonnegative("Cannot be negative").optional()),
  notes: string().optional(),
});

export const StockModificationSchema = object({
  category: string({ required_error: "Category is required" }),
  reason: string({ required_error: "Reason is required" }).min(1, "Reason is required"),
  modificationDate: string().optional(),
  notes: string().optional(),
  items: array(StockModificationItemSchema).min(1, "At least one item is required"),
});
