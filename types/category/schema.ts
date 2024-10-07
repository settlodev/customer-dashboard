import {boolean, object, string} from "zod";

export const CategorySchema = object({
    name: string().min(2, 'Category name must be less than 2 characters').max(20, 'Category name can not be more than 20 characters'),
    parentId: string().uuid().optional(),
    status: boolean(),
    image: string().optional(),
    description: string().optional()
})
