import { z } from "zod";

const StockRequestItemSchema = z.object({
    warehouseStockVariant: z.string({ message: "Please select a stock variant" }).uuid(),
    quantity: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val);
            }
            return val;
        },
        z.number({ message: "Quantity is required" })
            .nonnegative({ message: "Quantity cannot be negative" })
            .gt(0, { message: "Quantity cannot be zero" })
    ),
});

export const StockRequestSchema = z.object({
    fromLocation: z.string({ message: "Please select a business location" }).uuid(),
    toWarehouse: z.string({ message: "Please select a warehouse where stock will be requested" }).uuid(),
    locationStaffRequested: z.string({ message: "Please select a staff" }).uuid(),
    stockRequested: z.array(StockRequestItemSchema).min(1, { message: "At least one item must be requested" }),
    status: z.boolean().optional(),
    comment: z.string().optional()
});
