import { boolean, number, object, string } from "zod";

export const CategorySchema = object({
  name: string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name can not exceed 50 characters"),
  description: string().optional(),
  imageUrl: string().optional(),
  parentId: string().nullable().optional(),
  sortOrder: number().optional(),
  active: boolean().optional(),
});
