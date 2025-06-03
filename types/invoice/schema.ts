import { coerce, object, z } from "zod";

export const InvoiceSchema = object({
    subscriptions: z.array(
        z.object({
          subscription: z.union([
            z.string().min(1, "Subscription is required"),
            z.object({ id: z.string().uuid() }).passthrough(),
          ]),
          quantity: z.number().min(1, "Quantity must be at least 1 month"),
        })
      ).min(1, "At least one month is required"),
      discount: coerce.number().optional().refine(value => value !== undefined && value >= 0, {
        message: "Discount must be a positive number",
      }).refine(value => value !== undefined).optional(),
})