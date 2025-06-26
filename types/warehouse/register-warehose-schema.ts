import {object, string} from "zod";


export const RegisterWarehouseSchema = object({
    name: string().min(3, "Please enter a valid name"),
    address: string().min(3, "Please enter a valid address"),
    city: string().min(3, "Please enter a valid city"),
});