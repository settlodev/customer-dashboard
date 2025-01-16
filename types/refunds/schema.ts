import { boolean, object, string} from "zod";

export const OrderSchema = object({
    name: string({ message: "Unit name is required" }).min(3,"Please enter a valid unit name"),
   
    status: boolean().optional(),
});