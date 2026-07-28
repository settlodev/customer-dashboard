import { z } from "zod";


export const efdSettingsSchema = z.object({
  isEfdEnabled: z.boolean().default(false),
  businessName: z.string().min(1, "Business name is required").optional().or(z.literal("")),
  tinNumber: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val === "" || /^\d{9}$/.test(val), {
      message: "TIN must be exactly 9 digits"
    })
    .optional()
    .or(z.literal("")),
  emailAddress: z.string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  phoneNumber: z.string()
    .regex(/^(\+255|0)[67]\d{8}$/, "Please enter a valid Tanzanian phone number")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  
  if (data.isEfdEnabled) {
    return (
      data.businessName && 
      data.businessName.trim() !== "" &&
      data.tinNumber && 
      data.tinNumber.trim() !== "" &&
      data.emailAddress && 
      data.emailAddress.trim() !== "" &&
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