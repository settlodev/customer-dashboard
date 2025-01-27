import { isValidPhoneNumber } from "libphonenumber-js";
import {boolean, object, string} from "zod";

export const LocationSchema = object({
    name: string().min(2, 'Name of location must be more than 3 characters').max(50, 'Name of location can not be more than 50 characters'),
    phone: string().min(8, 'Phone number must be more than 8 characters').max(20, 'Phone number can not be more than 20 characters').refine(isValidPhoneNumber, {
        message: "Invalid phone number",
    }),
    email: string().min(2, 'Email must be less than 10 characters').max(120, 'Email can not be more than 120 characters').optional().nullish(),
    description: string().min(2, 'Description must be more than 2 characters').max(120, 'Description can not be more than 120 characters').optional().nullish(),
    address: string().min(2, 'Address must be more than 20 characters').max(120, 'Address can not be more than 0 characters'),
    city: string(),
    region: string().optional().nullish(),
    street: string().optional().nullish(),
    openingTime: string(),
    closingTime: string(),
    status: boolean().optional().nullish(),
    business: string().optional().nullish(),
    image: string().optional().nullish(),
   
    subscription: string().optional().nullish()
})
