import { z } from "zod";

/**
 * Proforma line — what the form edits. Note `taxRate` is captured here as a
 * PERCENT (0–100) for a friendly UX; the server action converts it to the
 * fraction the Accounting Service expects (18 → 0.18) before posting.
 */
export const ProformaLineSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal("")),
  stockVariantId: z.string().uuid().optional().or(z.literal("")),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description is too long"),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .gt(0, "Quantity must be greater than zero"),
  unitPrice: z.coerce
    .number({ invalid_type_error: "Unit price must be a number" })
    .min(0, "Unit price cannot be negative"),
  lineDiscountAmount: z.coerce
    .number({ invalid_type_error: "Discount must be a number" })
    .min(0, "Discount cannot be negative")
    .optional(),
  /** Percentage (0–100); converted to a fraction server-side. */
  taxRate: z.coerce
    .number({ invalid_type_error: "Tax rate must be a number" })
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%")
    .optional(),
  taxInclusive: z.boolean().default(false),
});

export type ProformaLineFormValues = z.infer<typeof ProformaLineSchema>;

export const ProformaSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  customerName: z
    .string()
    .min(1, "Customer name is required")
    .max(255, "Name is too long"),
  customerPhone: z.string().max(50).optional().or(z.literal("")),
  customerEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  customerTin: z.string().max(50).optional().or(z.literal("")),
  currencyCode: z.string().length(3, "Currency code must be 3 letters"),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid-until date"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  lines: z.array(ProformaLineSchema).min(1, "Add at least one line item"),
});

export type ProformaFormValues = z.infer<typeof ProformaSchema>;

/**
 * Invoice payment — `paymentMethodCode` is required by the backend (it stores
 * it as the human-readable method on the payment). `paymentMethodId` and
 * `sourceAccountId` are optional overrides. Currency is fixed to the invoice's
 * so it is intentionally not part of this form.
 */
export const InvoicePaymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Payment amount must be greater than zero"),
  paymentMethodId: z.string().uuid().optional().or(z.literal("")),
  paymentMethodCode: z
    .string()
    .min(1, "Select a payment method")
    .max(100),
  sourceAccountId: z.string().uuid().optional().or(z.literal("")),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reference: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type InvoicePaymentFormValues = z.infer<typeof InvoicePaymentSchema>;
