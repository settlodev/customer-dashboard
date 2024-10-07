import { boolean, object, string } from "zod";

export const SupplierSchema = object({
    name: string({
        required_error: "Name of supplier is required",
    }).min(3, "Name of supplier should be at least 3 characters").max(50, "Name of supplier can not be more than 50 characters"),
    email: string({
        required_error: "Email of supplier is required",
    }).email("Not a valid email"),
    phoneNumber: string({
        required_error: "Phone number of supplier is required",
    }).min(10, "Phone number should be at least 10 digits"),
    status: boolean().optional(),
})