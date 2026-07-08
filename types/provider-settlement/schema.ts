import { z } from "zod";

export const ProviderSettlementSchema = z
  .object({
    grossAmount: z.coerce.number().gt(0, "Gross amount must be greater than zero"),
    commissionAmount: z.coerce.number().min(0).optional(),
    bankAccountId: z.string().uuid().optional().or(z.literal("")),
    settlementDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    note: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => (d.commissionAmount ?? 0) <= d.grossAmount, {
    message: "Commission cannot exceed gross",
    path: ["commissionAmount"],
  });

export type ProviderSettlementFormValues = z.infer<typeof ProviderSettlementSchema>;
