import {boolean, object, string, array} from "zod";
import {VariantSchema} from "@/types/variant/schema";

export const ProductSchema = object({
    name: string({ required_error: "Product name is required" }).min(3, "Product name is required"),
    category: string().uuid(),
    department: string().uuid().optional(),
    brand: string().uuid().optional(),
    sku: string().optional(),
    image: string().optional(),
    description: string().optional(),
    color: string().optional(),
    status: boolean().optional(),
    sellOnline: boolean().optional(),
    slug: string().optional(),
    variants: array(VariantSchema)
});
