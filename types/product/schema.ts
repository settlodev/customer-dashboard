import {boolean, object, string, array} from "zod";
import {VariantSchema} from "@/types/variant/schema";

export const ProductSchema = object({
    name: string({ required_error: "Product name is required" }).min(3, "Product name is required"),
    category: string().uuid({ message: "Invalid category selected" }),
    department: string().uuid({ message: "Invalid department selected" }).optional().nullish(),
    brand: string().nullable().optional(),
    sku: string().nullable().optional(),
    image: string().nullable().optional(),
    description: string().nullable().optional(),
    color: string().nullable().optional(),
    status: boolean(),
    sellOnline: boolean(),
    trackInventory: boolean(),
    trackingType: string().optional().nullish(),
    taxIncluded: boolean(),
    taxClass: string().nullable().optional(),
    slug: string().optional(),
    variants: array(VariantSchema)
}).superRefine((data, ctx) => {
    if (data.trackInventory && data.trackingType) {
        const hasInvalidVariants = data.variants.some(variant => !variant.trackItem);
        if (hasInvalidVariants) {
            ctx.addIssue({
                code: "custom",
                message: "All variants must have a tracking item selected when tracking is enabled",
                path: ["variants"]
            });
        }
    }
});
