import { z } from "zod";

export const updatePaymentMethodsSchema = z.object({
  newAcceptedPaymentMethodTypeIds: z
    .array(
      z
        .string()
        .uuid({ message: "Each payment method ID must be a valid UUID" }),
    )
    .min(1, { message: "At least one payment method must be selected" }),
});

export type UpdatePaymentMethodsSchema = z.infer<
  typeof updatePaymentMethodsSchema
>;
