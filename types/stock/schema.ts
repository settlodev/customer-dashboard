import {boolean, object, string, array} from "zod";
import { StockVariantSchema } from "../stockVariant/schema";

export const StockSchema = object({
    name: string({ required_error: "Stock name is required" }).min(3, "Stock name is required"),
    description: string().optional(),
    status: boolean().optional(),
    stockVariants: array(StockVariantSchema)
}).refine(
    (data) => data.stockVariants.length > 0,
    {
        message: "At least one stock variant is required",
        path: ["stockVariants"],
    }
);
