import { object, string, preprocess, number, array, z, boolean } from "zod";

const StockItemSchema = object({
  stockVariantId: string({ message: "Please select stock item" }).uuid(),
  quantity: preprocess(
    (val) =>
      typeof val === "string" && val.trim() !== "" ? parseFloat(val) : val,
    number({ message: "Quantity is required" })
      .nonnegative()
      .gt(0, { message: "Quantity cannot be zero" }),
  ),
  value: preprocess(
    (val) =>
      typeof val === "string" && val.trim() !== "" ? parseFloat(val) : val,
    number({ message: "Value is required" })
      .nonnegative()
      .gt(0, { message: "Value cannot be zero" }),
  ),
  batchExpiryDate: string().optional(),
  orderDate: string({ required_error: "Order date is required" }),
  identifiers: array(string()).optional(),
});

export const StockIntakeSchema = object({
  supplier: string().uuid().optional(),
  staff: string({ message: "Please select a staff" }).uuid(),
  deliveryDate: string({ required_error: "Delivery date is required" }),
  items: array(StockItemSchema).min(1, {
    message: "At least one item required",
  }),
});

export type StockIntakePayload = z.infer<typeof StockIntakeSchema>;
export const MultiStockIntakeSchema = object({
  stockIntakes: array(StockIntakeSchema).min(1, {
    message: "At least one stock intake must be added",
  }),
  status: boolean().optional(),
});

export const UpdatedStockIntakeSchema = object({
  value: number()
    .min(0, { message: "Value must be a positive number" })
    .refine((val) => !isNaN(val), {
      message: "Please enter a valid number",
    }),
  quantity: number()
    .min(0, { message: "Value must be a positive number" })
    .refine((val) => !isNaN(val), {
      message: "Please enter a valid number",
    })
    .optional(),
});

export const receivedItemSchema = object({
  stockIntakePurchaseOrderItem: string().uuid("Invalid item ID"),
  quantityReceived: number().int().min(0, "Quantity cannot be negative"),
  totalCost: number().min(0, "Total cost cannot be negative"),
});

export const stockIntakeReceiptSchema = object({
  notes: string().nullish().optional(),
  staff: string().uuid("Invalid staff ID"),
  receivedAt: string().datetime("Invalid date format"),
  receivedItems: array(receivedItemSchema).min(
    1,
    "At least one item is required",
  ),
});
