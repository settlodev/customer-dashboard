import { z } from "zod";

export const VendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters").max(255),
  contactPerson: z.string().max(255).optional().or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  taxNumber: z.string().max(100).optional().or(z.literal("")),
  registrationNumber: z.string().max(100).optional().or(z.literal("")),
  defaultCurrencyCode: z
    .string()
    .length(3, "Currency code must be 3 letters")
    .optional()
    .or(z.literal("")),
  supplierId: z.string().uuid().optional().nullable().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type VendorFormValues = z.infer<typeof VendorSchema>;
