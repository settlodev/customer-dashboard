import {object, string} from "zod";

export const CategorySchema = object({
    name: string().min(2, 'Category name must be less than 2 characters').max(20, 'Category name can not be more than 20 characters'),
    parentId: string().nullable().optional(),
    status: string().optional(),
    image: string().optional(),
    description: string().optional()
})
