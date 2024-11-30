import {boolean, object, string, array} from "zod";
import {VariantSchema} from "@/types/variant/schema";

export const ProductSchema = object({
    name: string({ required_error: "Product name is required" }).min(3, "Product name is required"),
    category: string().uuid(),
    department: string().uuid().optional(),
    brand: string().nullable().optional(),
    sku: string().nullable().optional(),
    image: string().nullable().optional(),
    description: string().optional(),
    color: string().nullable().optional(),
    status: boolean().optional(),
    sellOnline: boolean().optional(),
    trackInventory: boolean().optional(),
    taxIncluded: boolean().optional(),
    taxClass: string().optional(),
    slug: string().optional(),
    variants: array(VariantSchema).optional(),
    // stock: string().uuid().optional(),
    // stockVariant: string().uuid().optional(),
});
