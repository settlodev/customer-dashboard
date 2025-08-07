import { z } from "zod";

// Zod schema for EFD settings form
export const efdSettingsSchema = z.object({
  isEfdEnabled: z.boolean().default(false),
  businessName: z.string().min(1, "Business name is required").optional().or(z.literal("")),
  tin: z.string()
    .regex(/^\d{9}$/, "TIN must be exactly 9 digits")
    .optional()
    .or(z.literal("")),
  email: z.string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phoneNumber: z.string()
    .regex(/^(\+255|0)[67]\d{8}$/, "Please enter a valid Tanzanian phone number")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  // If EFD is enabled, all fields are required
  if (data.isEfdEnabled) {
    return (
      data.businessName && 
      data.businessName.trim() !== "" &&
      data.tin && 
      data.tin.trim() !== "" &&
      data.email && 
      data.email.trim() !== "" &&
      data.phoneNumber && 
      data.phoneNumber.trim() !== ""
    );
  }
  return true;
}, {
  message: "All fields are required when EFD is enabled",
  path: ["isEfdEnabled"],
});

export type EfdSettingsFormData = z.infer<typeof efdSettingsSchema>;