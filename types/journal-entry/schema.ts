import { z } from "zod";

export const JournalEntryLineSchema = z
  .object({
    chartOfAccountId: z.string().uuid("Pick an account"),
    description: z.string().max(500).optional().or(z.literal("")),
    debitAmount: z.coerce.number().nonnegative("Cannot be negative").default(0),
    creditAmount: z.coerce.number().nonnegative("Cannot be negative").default(0),
  })
  .refine(
    (line) =>
      (line.debitAmount > 0 && line.creditAmount === 0) ||
      (line.creditAmount > 0 && line.debitAmount === 0),
    {
      message: "Each line must be either a debit or a credit, not both",
    },
  );

export const JournalEntrySchema = z
  .object({
    description: z
      .string()
      .min(3, "Description must be at least 3 characters")
      .max(500),
    reference: z.string().max(255).optional().or(z.literal("")),
    entryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    currencyCode: z.string().length(3),
    exchangeRate: z.coerce.number().gt(0).optional(),
    lines: z.array(JournalEntryLineSchema).min(2, "At least two lines required"),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((s, l) => s + (l.debitAmount || 0), 0);
      const totalCredit = data.lines.reduce(
        (s, l) => s + (l.creditAmount || 0),
        0,
      );
      return Math.abs(totalDebit - totalCredit) < 0.0001;
    },
    {
      message: "Total debits must equal total credits",
      path: ["lines"],
    },
  );

export type JournalEntryFormValues = z.infer<typeof JournalEntrySchema>;
