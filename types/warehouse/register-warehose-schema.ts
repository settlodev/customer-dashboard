import { isValidPhoneNumber } from "libphonenumber-js";
import {object, string} from "zod";


export const RegisterWarehouseSchema = object({
    name: string().min(3, "Please enter a valid name"),
    address: string().min(3, "Please enter a valid address"),
    city: string().min(3, "Please enter a valid city"),
    phone: string({ required_error: "Phone number is required" }).refine(
        isValidPhoneNumber,
        {
          message: "Invalid phone number",
        }
      ),
    image: string().optional(),
    email: string({ required_error: "Email is required" }).email("Please enter a valid email address"),
    description: string().optional(),
    openingTime: string({ required_error: "Opening time is required" }),
    closingTime: string({ required_error: "Closing time is required" }),  
});