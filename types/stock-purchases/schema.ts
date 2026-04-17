import { z } from "zod";

export const StockPurchaseItemSchema = z.object({
  stockVariantId: z.string({ message: "Please select a stock variant" }).uuid(),
  quantity: z.preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") {
        return parseInt(val);
      }
      return val;
    },
    z
      .number({ message: "Quantity is required" })
      .nonnegative({ message: "Quantity can not be negative" })
      .gt(0, { message: "Quantity can not be zero" }),
  ),
  // Optional ISO 4217 code of the supplier's quoted price. When omitted the
  // backend treats the amount as the location's base currency.
  currency: z
    .string()
    .length(3, { message: "Use a 3-letter ISO currency code" })
    .optional()
    .nullish(),
});

export const StockPurchaseSchema = z.object({
  supplier: z.string({ message: "Please select a supplier" }).uuid(),
  stockIntakePurchaseOrderItems: z
    .array(StockPurchaseItemSchema)
    .min(1, { message: "At least one stock item is required" }),
  deliveryDate: z.string({ message: "Please select a date" }),
  notes: z.string({ message: "Please provide description about LPO" }),
});

export type StockPurchaseItem = z.infer<typeof StockPurchaseItemSchema>;
export type StockPurchaseFormData = z.infer<typeof StockPurchaseSchema>;
