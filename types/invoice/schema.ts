import { coerce, object, z } from "zod";

export const InvoiceSchema = object({
    locationSubscriptions: z.array(
        z.object({
          subscription: z.union([
            z.string().min(1, "Subscription is required"),
            z.object({ id: z.string().uuid() }).passthrough(),
          ]),
          numberOfMonths: z.number().min(1, "Number of months must be at least 1 month"),
          subscriptionDiscount: z.string().uuid().optional(),
        })
      ),
      email: z.string().email("Not a valid email").optional(),
      phone: z.string().optional(),
      discountCode: z.string().optional(),
      discountAmount: z.number().min(0).optional(),
      
})