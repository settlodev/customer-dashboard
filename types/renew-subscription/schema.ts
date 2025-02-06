import { isValidPhoneNumber } from "libphonenumber-js";
import { number, object, string } from "zod";
export const RenewSubscriptionSchema = object({
    quantity: number({ required_error: "Renewal duration is required" }).min(1, { message: "Renewal duration must be at least 1 month" }).nonnegative({ message: "Renewal duration can not be negative" }),
    discount: string().optional(),
    phone: string({ required_error: "Phone number is required" })
    .refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }),
    email: string({ required_error: "Email is required" }).email("Not a valid email"),
    planId: string({ required_error: "Plan is required" }).uuid("Please select a valid plan"),
})
