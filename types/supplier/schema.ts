import { isValidPhoneNumber } from "libphonenumber-js";
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
    })  .refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }),
    contactPersonName: string({
        required_error: "Contact person of supplier is required",
    }).min(3, "Contact person of supplier should be at least 3 characters").max(50, "Contact person of supplier can not be more than 50 characters").optional(),
    contactPersonPhone: string({
        required_error: "Contact person phone number of supplier is required",
    }).refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }).optional(),
    contactPersonTitle: string({
        required_error: "Contact person title of supplier is required",
    }).min(3, "Contact person title of supplier should be at least 3 characters").max(50, "Contact person title of supplier can not be more than 50 characters").optional(),
    contactPersonEmail: string({
        required_error: "Email of supplier is required",
    }).email("Not a valid email").optional(),
    physicalAddress: string({
        required_error: "Physical address of supplier is required",
    }).min(3, "Physical address of supplier should be at least 3 characters").max(50, "Physical address of supplier can not be more than 50 characters").optional(),
    status: boolean().optional(),
})