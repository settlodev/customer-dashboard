import { array, boolean, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockVariantSchema = object({
  id: string().uuid().optional(),
  name: string({ required_error: "Variant name is required" }).min(
    1,
    "Variant name is required",
  ),
  sku: string().optional().nullish(),
  unitId: string({ required_error: "Unit is required" }).uuid(
    "Select a valid unit",
  ),
  conversionToBase: preprocess(
    toNumber,
    number().positive().default(1),
  ),
  barcode: string().max(50).optional().nullish(),
  serialTracked: boolean().default(false),
  archived: boolean().default(false),
  initialQuantity: preprocess(toNumber, number().nonnegative().default(0)),
  initialUnitCost: preprocess(toNumber, number().nonnegative().default(0)),
  serialNumbers: array(string()).optional(),

  // Optional reorder / alert config, applied to the InventoryBalance row the
  // stock creation flow creates. Left undefined → backend doesn't touch them.
  reorderPoint: preprocess(toNumber, number().nonnegative().optional()),
  reorderQuantity: preprocess(toNumber, number().positive().optional()),
  preferredSupplierId: string().uuid().optional().or(string().length(0)),
  lowStockThreshold: preprocess(toNumber, number().nonnegative().optional()),
  overstockThreshold: preprocess(toNumber, number().nonnegative().optional()),
}).superRefine((val, ctx) => {
  if (
    val.lowStockThreshold != null &&
    val.overstockThreshold != null &&
    val.overstockThreshold < val.lowStockThreshold
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["overstockThreshold"],
      message: "Overstock must be greater than low-stock threshold",
    });
  }
  if (
    val.reorderPoint != null &&
    val.lowStockThreshold != null &&
    val.reorderPoint < val.lowStockThreshold
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["reorderPoint"],
      message: "Reorder point should be at or above the low-stock threshold",
    });
  }
});

export const StockSchema = object({
  name: string({ required_error: "Stock name is required" }).min(
    2,
    "Name must be at least 2 characters",
  ),
  description: string().optional().nullish(),
  baseUnitId: string({ required_error: "Base unit is required" }).uuid(
    "Select a valid unit",
  ),
  materialType: string().default("FINISHED_GOOD"),
  variants: array(StockVariantSchema).min(
    1,
    "At least one variant is required",
  ),
});
