import { isValidPhoneNumber } from "libphonenumber-js";
import {boolean, object, string} from "zod";

export const LocationSchema = object({
    name: string().min(2, 'Name of location must be less than 3 characters').max(50, 'Name of location can not be more than 50 characters'),
    phone: string().min(8, 'Phone number must be less than 10 characters').max(15, 'Phone number can not be more than 15characters').refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }),
    email: string().min(2, 'Email must be less than 10 characters').max(120, 'Email can not be more than 120characters').optional(),
    description: string().min(2, 'Description must be less than 20 characters').max(120, 'Description can not be more than 20 characters'),
    address: string().min(2, 'Address must be less than 20 characters').max(120, 'Address can not be more than 20 characters'),
    city:string(),
    region:string(),
    street:string(),
    openingTime:string(),
    closingTime:string(),
    status: boolean().optional(),
})
