import { z } from "zod";

/**
 * Loan application — what the apply wizard collects across its steps and
 * posts on the final "Submit". The three acceptances are required to be
 * `true` (they gate the Terms step), so a parse failure here also guards the
 * server action against an un-accepted submission.
 */
export const LoanApplicationSchema = z.object({
  productKey: z.enum(["DEVICE_FINANCING", "STOCK_LOAN", "WORKING_CAPITAL"]),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Enter how much you'd like to borrow"),
  termMonths: z.coerce
    .number({ invalid_type_error: "Term must be a number" })
    .int()
    .gt(0, "Choose a repayment term"),
  purpose: z
    .string()
    .min(1, "Tell us what the funds are for")
    .max(200, "Keep the purpose under 200 characters"),
  disbursementChannel: z.enum([
    "MPESA",
    "TIGO_PESA",
    "AIRTEL_MONEY",
    "BANK",
  ]),
  acceptAgreement: z.literal(true, {
    errorMap: () => ({ message: "Accept the financing agreement to continue" }),
  }),
  acceptAutoDeduct: z.literal(true, {
    errorMap: () => ({ message: "Authorize auto-deduction to continue" }),
  }),
  acceptDetails: z.literal(true, {
    errorMap: () => ({ message: "Confirm your disbursement details" }),
  }),
});

export type LoanApplicationFormValues = z.infer<typeof LoanApplicationSchema>;

/**
 * The wizard's working form is looser than the final submit (the acceptances
 * start `false` and amount can be mid-edit). We validate per-step with this
 * input shape and only run {@link LoanApplicationSchema} at submit time.
 */
export type LoanApplicationDraft = {
  productKey: LoanApplicationFormValues["productKey"];
  amount: number;
  termMonths: number;
  purpose: string;
  disbursementChannel: LoanApplicationFormValues["disbursementChannel"];
  acceptAgreement: boolean;
  acceptAutoDeduct: boolean;
  acceptDetails: boolean;
};

/**
 * Manual (early / extra) repayment toward an active loan. Auto-deduction from
 * sales continues regardless — this is an additional payment.
 */
export const LoanPaymentSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .gt(0, "Payment amount must be greater than zero"),
  channel: z.enum(["MPESA", "TIGO_PESA", "AIRTEL_MONEY", "BANK"]),
  reference: z.string().max(255).optional().or(z.literal("")),
});

export type LoanPaymentFormValues = z.infer<typeof LoanPaymentSchema>;
