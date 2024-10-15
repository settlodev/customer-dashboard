import {boolean, object, string, number, array} from "zod";
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
    sellOnline: boolean(),
    variants: array(VariantSchema),

    variantName: string().optional(),
    price: number().min(0).optional(),
    cost: number().min(0).optional(),
    quantity: number().min(0).optional(),
    variantSku: string().optional(),
    variantDescription: string().optional(),
    variantImage: string().optional(),
    variantStatus: boolean().optional(),
    variantColor: string().optional(),
    taxIncluded: boolean().optional(),
    taxAmount: number().optional()
});
