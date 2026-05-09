import { z } from "zod";

export const TaxTypeSchema = z.object({
  code: z.string().min(1, "Code is required").max(10),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  ratePercent: z.coerce
    .number()
    .min(0, "Rate cannot be negative")
    .max(100, "Rate cannot exceed 100%"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type TaxTypeFormValues = z.infer<typeof TaxTypeSchema>;
