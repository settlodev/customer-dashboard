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
  barcode: string().max(50).optional().nullish(),
  serialTracked: boolean().default(false),
  archived: boolean().default(false),
  initialQuantity: preprocess(toNumber, number().nonnegative().default(0)),
  initialUnitCost: preprocess(toNumber, number().nonnegative().default(0)),
  serialNumbers: array(string()).optional(),

  // Selling price for the matching product variant when autoCreateProduct
  // is set on the stock form. Ignored on the regular createStock path.
  // Nonnegative (not strictly positive) so merchants can save a
  // not-yet-priced product variant — the stock form surfaces an inline
  // warning when qty>0 with no price set.
  sellingPrice: preprocess(toNumber, number().nonnegative().optional()),

  // Optional reorder / alert config, applied to the InventoryBalance row the
  // stock creation flow creates. Left undefined → backend doesn't touch them.
  reorderPoint: preprocess(toNumber, number().nonnegative().optional()),
  reorderQuantity: preprocess(toNumber, number().positive().optional()),
  preferredSupplierId: string().uuid().optional().or(string().length(0)),
  lowStockThreshold: preprocess(toNumber, number().nonnegative().optional()),
  overstockThreshold: preprocess(toNumber, number().nonnegative().optional()),
  depositValue: preprocess(toNumber, number().nonnegative().optional()),
  depositCurrency: string().length(3, "Currency must be a 3-letter ISO code").optional().nullish(),
  returnableContainers: array(
    object({
      containerStockVariantId: string().uuid(),
      quantityPerUnit: preprocess(toNumber, number().positive()),
    }),
  ).optional(),
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
  /**
   * Up to 5 image URLs for the stock gallery. Element 0 is the
   * cover/thumbnail. Matches the backend's {@code List<String>
   * imageUrls} on Stock (cap enforced at the service layer).
   */
  imageUrls: array(string()).max(5, "Up to 5 images per stock item").default([]),
  variants: array(StockVariantSchema).min(
    1,
    "At least one variant is required",
  ),
});
