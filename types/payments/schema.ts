import { z } from "zod";

export const updatePaymentMethodsSchema = z.object({
  newAcceptedPaymentMethodTypeIds: z.array(z.string().uuid()).min(1),
});

const paymentMethodItemSchema = z.object({
  acceptedPaymentMethodType: z.string().uuid({
    message: "Invalid UUID format for acceptedPaymentMethodType",
  }),
  accountNumber: z
    .string()
    .min(1, "Account number is required")
    .max(50, "Account number cannot exceed 50 characters")
    .regex(
      /^[A-Za-z0-9\-\s]+$/,
      "Account number can only contain letters, numbers, hyphens and spaces",
    ),
  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .default(""),
});

export const physicalReceiptPaymentDetailsSchema = z
  .array(paymentMethodItemSchema)
  .min(1, "At least one payment method is required")
  .max(50, "Cannot exceed 50 payment methods");

export type PhysicalReceiptPaymentDetails = z.infer<
  typeof physicalReceiptPaymentDetailsSchema
>;
