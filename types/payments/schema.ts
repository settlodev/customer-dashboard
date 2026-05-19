import { z } from "zod";

export const togglePaymentMethodSchema = z.object({
  enabled: z.boolean(),
});

export const configureProviderSchema = z.object({
  providerSlug: z.string().min(1),
  enabled: z.boolean(),
  credentials: z.record(z.string()),
  configOverrides: z.record(z.string()).optional(),
  createdBy: z.string().uuid().optional(),
});

export const locationOverrideSchema = z.object({
  locationId: z.string().uuid(),
  enabled: z.boolean(),
  credentialOverrides: z.record(z.string()).optional(),
  configOverrides: z.record(z.string()).optional(),
});

// Receipt payment details (unchanged)
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
    .min(5, "Notes are required")
    .max(500, "Notes cannot exceed 500 characters"),
});

export const physicalReceiptPaymentDetailsSchema = z
  .array(paymentMethodItemSchema)
  .min(1, "At least one payment method is required")
  .max(50, "Cannot exceed 50 payment methods");

export type PhysicalReceiptPaymentDetails = z.infer<
  typeof physicalReceiptPaymentDetailsSchema
>;
