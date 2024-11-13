import {boolean, nativeEnum, object, string} from "zod";
import {isValidPhoneNumber} from "libphonenumber-js";
import {Gender} from "@/types/enums";


export const CustomerSchema = object({
    firstName: string({ required_error: "Customer first name is required" }).min(
        3,
        "Please enter a valid name",
    ),
    lastName: string({ required_error: "Customer last name is required" }).min(
        3,
        "Please enter a valid name",
    ),
    email: string()
        .min(1, "Please enter a valid email address")
        .email("Please enter a valid email address")
        .optional(),
    phoneNumber: string({ message: "Customer Phone number is required" })
        .refine(isValidPhoneNumber, {
            message: "Invalid phone number",
        })
    ,
    gender: nativeEnum(Gender),
    allowNotifications: boolean().optional(),
    status:boolean().optional(),
});



