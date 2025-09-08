import { array, number, object, string, union, z } from "zod";

export const warehouseInvoiceSchema = object({
    warehouseSubscriptions: array(
        z.object({
            subscription: union([
                string().min(1, "Subscription is required"),
                object({ id: z.string().uuid() }).passthrough(),
            ]).optional(),
            numberOfMonths: number().min(1, "Number of months must be at least 1 month"),
            subscriptionDiscount: string().uuid().optional(),
        })
    ).min(1, "At least one subscription is required"),
    email: string().email("Not a valid email").min(1, "Email is required"),
    phone: string().min(1, "Phone number is required"),
});