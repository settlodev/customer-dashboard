import { z } from "zod";

export const ExpenseCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  code: z.string().max(20).optional().or(z.literal("")),
  parentId: z.string().uuid().optional().nullable().or(z.literal("")),
  chartOfAccountId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export type ExpenseCategoryFormValues = z.infer<typeof ExpenseCategorySchema>;
