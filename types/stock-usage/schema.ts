import { array, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockUsageItemSchema = object({
  stockVariantId: string({ required_error: "Select stock item" }).uuid({
    message: "Select stock item",
  }),
  quantity: preprocess(
    toNumber,
    number({ required_error: "Quantity is required" }).positive(
      "Quantity must be greater than zero",
    ),
  ),
  // Optional override cost (e.g. department-specific valuation), in the
  // location base currency. Falls back to the variant's average cost when blank.
  unitCost: preprocess(
    toNumber,
    number().nonnegative("Cannot be negative").optional(),
  ),
  batchId: string().uuid().optional().or(string().length(0).transform(() => undefined)),
  serialNumbers: array(string()).optional(),
  notes: string().optional(),
});

export const StockUsageSchema = object({
  category: string({ required_error: "Category is required" }),
  purpose: string({ required_error: "Purpose is required" }).min(
    1,
    "Purpose is required",
  ),
  recipientId: string({ required_error: "Recipient is required" }).uuid({
    message: "Select the staff member who used the stock",
  }),
  departmentId: string().uuid().optional().or(string().length(0).transform(() => undefined)),
  usageDate: string().optional(),
  notes: string().optional(),
  items: array(StockUsageItemSchema).min(1, "At least one item is required"),
});

export const ReverseStockUsageSchema = object({
  reason: string({ required_error: "Reason is required" })
    .min(1, "Reason is required")
    .max(2000, "Reason must be 2000 characters or fewer"),
});
