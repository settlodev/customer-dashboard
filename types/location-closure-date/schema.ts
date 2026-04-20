import { z } from "zod";

export const ClosureDateSchema = z.object({
  closureDate: z
    .string({ required_error: "Date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date"),
  reason: z.string().optional(),
  allDay: z.boolean().optional(),
});

export type ClosureDateValues = z.infer<typeof ClosureDateSchema>;
