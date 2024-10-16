import { isValidPhoneNumber } from "libphonenumber-js";
import { boolean, date, number, object, string } from "zod";

export const ReservationSchema = object({
    startDate: string({ required_error: "Start date is required" }),
    endDate: string({ required_error: "End date is required" }),
    numberOfPeople: number({ required_error: "Number of people is required" }),
    date: string({ required_error: "Time is required" }),
    name: string({ required_error: "Name is required" }),
    email: string({ required_error: "Email is required" }),
    phone: string({ required_error: "Phone number is required" }).refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }),
    product: string({ required_error: "Product is required" }),
    customer: string({}).optional(),
    status: boolean().optional(),
})