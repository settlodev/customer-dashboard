import { isValidPhoneNumber } from "libphonenumber-js";
import { object, string, number } from "zod";

export const PrepaymentFormSchema = object({
  email: string({ required_error: "Email is required" })
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  phone: string({ required_error: "Phone number is required" }).refine(
    isValidPhoneNumber,
    { message: "Please enter a valid phone number" },
  ),
  monthsToPrepay: number({ required_error: "Duration is required" })
    .min(1, "Minimum 1 month")
    .max(24, "Maximum 24 months"),
  couponCode: string().optional(),
});
