import { isValidPhoneNumber } from "libphonenumber-js";
import { object, string } from "zod";

export const SupplierSchema = object({
  name: string({ required_error: "Supplier name is required" })
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name cannot exceed 200 characters"),
  contactPersonName: string({ required_error: "Contact person name is required" })
    .min(2, "Contact name must be at least 2 characters")
    .max(150, "Contact name cannot exceed 150 characters"),
  contactPersonPhone: string({ required_error: "Contact phone is required" })
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  phone: string()
    .optional()
    .nullish()
    .refine(
      (v) => !v || v === "" || isValidPhoneNumber(v),
      "Invalid phone number",
    ),
  email: string().email("Not a valid email").optional().nullish().or(string().length(0)),
  address: string().max(500).optional().nullish(),
  registrationNumber: string().max(50).optional().nullish(),
  tinNumber: string().max(50).optional().nullish(),
  settloSupplierId: string().uuid().optional().nullish().or(string().length(0)),
});
