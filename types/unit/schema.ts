import { boolean, object, string} from "zod";

export const UnitSchema = object({
    name: string({ message: "Unit name is required" }).min(3,"Please enter a valid unit name"),
    symbol: string({ message: "Unit symbol is required" }).min(3,"Please enter a valid unit symbol"),
    status: boolean().optional(),
});