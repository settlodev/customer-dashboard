import {object, string, number} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }),
    price: number(),
    cost: number(),
    quantity: number(),
    sku: string().optional(),
    description: string().optional(),
    image: string().optional(),
    color: string().optional()
});
