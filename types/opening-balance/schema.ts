import { z } from "zod";

export const OpeningBalanceSchema = z.object({
  asOfDate: z.string().optional(),
  lines: z
    .array(
      z.object({
        chartOfAccountId: z.string().min(1, "Pick an account"),
        amount: z
          .number({ invalid_type_error: "Enter an amount" })
          .refine((n) => n !== 0, "Enter a non-zero amount"),
      }),
    )
    .min(1, "Add at least one account"),
});

export type OpeningBalanceFormValues = z.infer<typeof OpeningBalanceSchema>;
