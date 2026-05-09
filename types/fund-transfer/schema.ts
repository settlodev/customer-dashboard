import { z } from "zod";

export const FundTransferSchema = z
  .object({
    fromAccountId: z.string().uuid("Pick a source account"),
    toAccountId: z.string().uuid("Pick a destination account"),
    amount: z.coerce.number().gt(0, "Amount must be greater than zero"),
    currencyCode: z.string().length(3),
    transferDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    description: z.string().max(500).optional().or(z.literal("")),
    reference: z.string().max(255).optional().or(z.literal("")),
    notes: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "Source and destination must differ",
    path: ["toAccountId"],
  });

export type FundTransferFormValues = z.infer<typeof FundTransferSchema>;
