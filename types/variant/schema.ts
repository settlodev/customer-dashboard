import {object, string, number} from "zod";

export const VariantSchema = object({
    name: string({ required_error: "Variant name is required" }).min(3, "Variant name is required"),
    price: number().min(0),
    cost: number().min(0),
    quantity: number().min(0).default(0).optional(),
    sku: string().optional(),
    description: string().optional(),
    image: string().optional(),
    color: string().optional()
});
