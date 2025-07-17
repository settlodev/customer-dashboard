import { isValidPhoneNumber } from "libphonenumber-js";
import { boolean, object, string } from "zod";

export const LocationSchema = object({
  name: string({ required_error: "Location name is required" })
    .min(3, "Name should be at least 3 characters")
    .max(50, "Name can not be more than 50 characters"),
  phone: string({ required_error: "Phone number is required" })
    .min(8, "Phone number must be more than 8 characters")
    .max(20, "Phone number can not be more than 20 characters")
    .refine(isValidPhoneNumber, {
      message: "Invalid phone number",
    }),
  email: string({ required_error: "Email address is required" }).email(
    "Please enter a valid email address",
  ),
  description: string().optional(),
  address: string({ required_error: "Location address is required" }),
  city: string({ required_error: "City is required" }),
  region: string().optional().nullish(),
  street: string().optional(),
  openingTime: string({ required_error: "Opening time is required" }),
  closingTime: string({ required_error: "Closing time is required" }),
  status: boolean().optional(),
  subscription: string().optional().nullish(),
});
