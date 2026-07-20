import { array, enum as zEnum, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockModificationItemSchema = object({
  stockVariantId: string({ required_error: "Select stock item" }).uuid({
    message: "Select stock item",
  }),
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

/**
 * A value-only correction: re-costs one batch without moving quantity.
 * Posted as a `CORRECTION` stock modification whose single line carries
 * `quantityChange: 0` — kept separate from `StockModificationSchema` because
 * that schema's `quantityChange` explicitly refuses zero.
 */
export const CorrectValueSchema = object({
  stockVariantId: string({ required_error: "Select stock item" }).uuid({
    message: "Select stock item",
  }),
  batchId: string({ required_error: "Batch is required" }).uuid({
    message: "Batch is required",
  }),
  newUnitCost: preprocess(
    toNumber,
    number({ required_error: "Cost is required" }).min(0, "Cost cannot be negative"),
  ),
  currency: string().optional(),
  reason: string({ required_error: "Reason is required" }).min(
    1,
    "Please say why the value is being corrected",
  ),
  notes: string().optional(),
  sourceReferenceType: zEnum(["STOCK_INTAKE", "OPENING_STOCK"]).optional(),
  sourceReferenceId: string().uuid().optional(),
});
