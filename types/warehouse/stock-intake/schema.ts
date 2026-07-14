import { z } from "zod";

export const StockIntakeItemSchema = z
  .object({
    stockVariant: z.string({ message: "Please select stock item" }).uuid(),
    quantity: z.preprocess(
      (val) => {
        if (typeof val === "string" && val.trim() !== "") {
          return parseInt(val);
        }
        return val;
      },
      z
        .number({ message: "Quantity is required" })
        .nonnegative({ message: "Quantity cannot be negative" })
        .gt(0, { message: "Quantity cannot be zero" }),
    ),
    value: z.preprocess(
      (val) => {
        if (typeof val === "string" && val.trim() !== "") {
          return parseFloat(val);
        }
        return val;
      },
      z
        .number({ message: "Value of inventory is required" })
        .nonnegative({ message: "Value cannot be negative" })
        .gt(0, { message: "Value cannot be zero" }),
    ),
    batchExpiryDate: z
      .string({ required_error: "Batch expiry date is required" })
      .optional(),
    orderDate: z.string({ required_error: "Order date is required" }),
    deliveryDate: z.string({ required_error: "Delivery date is required" }),
    staff: z.string({ message: "Please select a staff" }).uuid(),
    supplier: z.string().uuid().optional(),
    purchasePaidAmount: z.number().optional(),
    trackPurchase: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.trackPurchase && !data.supplier) {
        return false;
      }
      return true;
    },
    {
      message: "Supplier is required when tracking purchase",
      path: ["supplier"],
    },
  );

export const MultiStockIntakeSchema = z.object({
  stockIntakes: z
    .array(StockIntakeItemSchema)
    .min(1, { message: "At least one stock intake must be added" }),
  status: z.boolean().optional(),
});
