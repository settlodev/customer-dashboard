import { boolean, object, string, array } from "zod";
import { VariantSchema } from "@/types/variant/schema";

export const ProductSchema = object({
  name: string({ required_error: "Product name is required" }).min(
    2,
    "Product name must be at least 2 characters",
  ),
  description: string().nullable().optional(),
  categoryIds: array(string().uuid()).optional(),
  departmentId: string().uuid().optional().nullish(),
  brandId: string().nullable().optional(),
  imageUrl: string().nullable().optional(),
  sellOnline: boolean().default(true),
  trackStock: boolean().default(false),
  taxInclusive: boolean().default(false),
  taxClass: string().nullable().optional(),
  tags: array(string()).optional(),
  lifecycleStatus: string().optional(),
  active: boolean().default(true),
  variants: array(VariantSchema).min(1, "At least one variant is required").default([
    { name: "", price: 0, pricingStrategy: "MANUAL", unlimited: false },
  ]),
});
