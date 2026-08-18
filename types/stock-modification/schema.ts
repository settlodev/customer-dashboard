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
    number({ required_error: "Quantity is required" }),
  ),
  // Optional override cost (e.g. insurance valuation), in the location's base
  // currency. If absent, the backend uses the variant's average cost.
  // Required instead on a value-only line — see `batchId` and the
  // `StockModificationSchema`-level refinement below.
  unitCost: preprocess(toNumber, number().nonnegative("Cannot be negative").optional()),
  notes: string().optional(),
  /**
   * Present only on a value-only correction line (stock_modification_form's
   * "Value only" mode): targets one specific batch to re-cost, with no
   * quantity movement (`quantityChange: 0`). Absent for an ordinary
   * quantity-change line, where the backend picks a batch itself (FEFO).
   * `createStockModification` forwards `items` through unchanged, so this
   * rides straight to the POST body.
   */
  batchId: string().uuid().optional(),
});

export const StockModificationSchema = object({
  /**
   * Frontend-only mode switch — decides which per-item rule applies below.
   * Never reaches the backend: `createStockModification` builds its POST
   * body by naming fields explicitly rather than spreading this object, so
   * this key is dropped before the request goes out.
   */
  mode: zEnum(["QUANTITY", "VALUE_ONLY"]).default("QUANTITY"),
  category: string({ required_error: "Category is required" }),
  reason: string({ required_error: "Reason is required" }).min(1, "Reason is required"),
  modificationDate: string().optional(),
  notes: string().optional(),
  items: array(StockModificationItemSchema).min(1, "At least one item is required"),
}).superRefine((values, ctx) => {
  values.items.forEach((item, index) => {
    if (values.mode === "VALUE_ONLY") {
      if (!item.batchId) {
        ctx.addIssue({
          code: "custom",
          message: "Select a batch",
          path: ["items", index, "batchId"],
        });
      }
      if (item.unitCost == null) {
        ctx.addIssue({
          code: "custom",
          message: "Corrected unit cost is required",
          path: ["items", index, "unitCost"],
        });
      }
    } else if (item.quantityChange === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Quantity change cannot be zero",
        path: ["items", index, "quantityChange"],
      });
    }
  });
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
