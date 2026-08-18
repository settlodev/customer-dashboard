import { z } from "zod";

export const ExpenseSchema = z.object({
  vendorId: z
    .string()
    .uuid("Invalid vendor")
    .optional()
    .nullable()
    .or(z.literal("")),
  expenseCategoryId: z
    .string()
    .uuid("Invalid category")
    .optional()
    .nullable()
    .or(z.literal("")),
  chartOfAccountId: z
    .string()
    .uuid("Invalid account")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(500),
  reference: z.string().max(255).optional().or(z.literal("")),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Amount must be greater than zero"),
  taxAmount: z.coerce
    .number({ invalid_type_error: "Tax amount must be a number" })
    .nonnegative("Tax amount cannot be negative")
    .optional(),
  currencyCode: z.string().length(3, "Currency code must be 3 letters"),
  exchangeRate: z.coerce
    .number()
    .gt(0, "Exchange rate must be greater than zero")
    .optional(),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof ExpenseSchema>;

export const ExpensePaymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Payment amount must be greater than zero"),
  currencyCode: z.string().length(3),
  exchangeRate: z.coerce.number().gt(0).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  sourceAccountId: z.string().uuid("Pick a source account"),
  paymentMethodId: z.string().uuid("Pick a payment method"),
  paymentMethod: z.string().max(100).optional(),
  reference: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type ExpensePaymentFormValues = z.infer<typeof ExpensePaymentSchema>;

export const ExpenseCreditNoteSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Credit amount must be greater than zero"),
  reason: z.enum([
    "RETURN",
    "SHORT_DELIVERY",
    "PRICE_CORRECTION",
    "DAMAGE",
    "DISCOUNT",
    "OTHER",
  ]),
  offsetChartOfAccountId: z.string().uuid().optional().or(z.literal("")),
  creditNoteDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reference: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type ExpenseCreditNoteFormValues = z.infer<typeof ExpenseCreditNoteSchema>;

export const SupplierRefundReceiveSchema = z.object({
  cashAccountId: z.string().uuid("Pick a cash/bank account"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Refund amount must be greater than zero"),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reference: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type SupplierRefundReceiveValues = z.infer<typeof SupplierRefundReceiveSchema>;
