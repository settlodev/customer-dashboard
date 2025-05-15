import { z } from "zod";

export const dataDeletionSchema = z.object({
  requestType: z.enum(["delete", "clear"], {
    required_error: "Select a request type",
  }),
  reason: z.string().min(5, "Please provide a reason (min 5 characters)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type DataDeletionFormValues = z.infer<typeof dataDeletionSchema>;