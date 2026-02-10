// import {boolean, object, string, array} from "zod";
// import {VariantSchema} from "@/types/variant/schema";
//
// export const ProductSchema = object({
//     name: string({ required_error: "Product name is required" }).min(3, "Product name is required"),
//     category: string().uuid({ message: "Invalid category selected" }),
//     department: string().uuid({ message: "Invalid department selected" }).optional().nullish(),
//     brand: string().nullable().optional(),
//     sku: string().nullable().optional(),
//     image: string().nullable().optional(),
//     description: string().nullable().optional(),
//     color: string().nullable().optional(),
//     status: boolean(),
//     sellOnline: boolean(),
//     trackInventory: boolean(),
//     trackingType: string().optional().nullish(),
//     taxIncluded: boolean(),
//     taxClass: string().nullable().optional(),
//     slug: string().optional(),
//     variants: array(VariantSchema)
// }).superRefine((data, ctx) => {
//     if (data.trackInventory && data.trackingType) {
//         const hasInvalidVariants = data.variants.some(variant => !variant.trackItem);
//         if (hasInvalidVariants) {
//             ctx.addIssue({
//                 code: "custom",
//                 message: "All variants must have a tracking item selected when tracking is enabled",
//                 path: ["variants"]
//             });
//         }
//     }
// });

import { boolean, object, string, array } from "zod";
import { VariantSchema } from "@/types/variant/schema";

// export const ProductSchema = object({
//   name: string({ required_error: "Product name is required" }).min(
//     3,
//     "Product name is required",
//   ),
//   category: string().uuid({ message: "Invalid category selected" }),
//   department: string()
//     .uuid({ message: "Invalid department selected" })
//     .optional()
//     .nullish(),
//   brand: string().nullable().optional(),
//   sku: string().nullable().optional(),
//   image: string().nullable().optional(),
//   description: string().nullable().optional(),
//   color: string().nullable().optional(),
//   status: boolean(),
//   sellOnline: boolean(),
//   trackInventory: boolean(),
//   trackingType: string().optional().nullish(),
//   taxIncluded: boolean(),
//   taxClass: string().nullable().optional(),
//   slug: string().optional(),
//   variants: array(VariantSchema),
// }).superRefine((data, ctx) => {
//   if (data.trackInventory && data.trackingType) {
//     data.variants.forEach((variant, index) => {
//       // Validate stockItem when tracking type is STOCK
//       if (data.trackingType === "STOCK" && !variant.stockItem) {
//         ctx.addIssue({
//           code: "custom",
//           message: "Please select a stock item",
//           path: ["variants", index, "stockItem"],
//         });
//       }
//       // Validate recipeItem when tracking type is RECIPE
//       if (data.trackingType === "RECIPE" && !variant.recipeItem) {
//         ctx.addIssue({
//           code: "custom",
//           message: "Please select a recipe",
//           path: ["variants", index, "recipeItem"],
//         });
//       }
//     });
//   }
// });

export const ProductSchema = object({
  name: string({ required_error: "Product name is required" }).min(
    3,
    "Product name is required",
  ),
  category: string().uuid({ message: "Invalid category selected" }),
  department: string()
    .uuid({ message: "Invalid department selected" })
    .optional()
    .nullish(),
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
  variants: array(VariantSchema),
}).superRefine((data, ctx) => {
  if (data.trackInventory && data.trackingType) {
    data.variants.forEach((variant, index) => {
      // Validate based on trackingType
      if (data.trackingType === "STOCK") {
        if (!variant.stockItem) {
          ctx.addIssue({
            code: "custom",
            message: "Please select a stock item",
            path: ["variants", index, "stockItem"],
          });
        }
        // Also set trackItem for backward compatibility
        if (variant.stockItem) {
          (variant as any).trackItem = variant.stockItem;
        }
      }

      if (data.trackingType === "RECIPE") {
        if (!variant.recipeItem) {
          ctx.addIssue({
            code: "custom",
            message: "Please select a recipe",
            path: ["variants", index, "recipeItem"],
          });
        }
        // Also set trackItem for backward compatibility
        if (variant.recipeItem) {
          (variant as any).trackItem = variant.recipeItem;
        }
      }
    });
  }
});
