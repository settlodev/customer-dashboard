import {boolean, object, string} from "zod";

export const CategorySchema = object({
    name: string()
    .min(2, 'Category name must be at least 2 characters')
    .max(20, 'Category name can not be more than 20 characters'),
      parentCategory: string().nullable().optional(),
    status: boolean().optional(),
    image: string().optional(),
    description: string().nullable().optional()
})
