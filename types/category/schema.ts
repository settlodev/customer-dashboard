import {boolean, object, string} from "zod";

export const CategorySchema = object({
    name: string().min(2, 'Category must be less than 2 characters').max(20, 'Category can not be more than 20 characters'),
    parentId: string().uuid().optional(),
    status: boolean().optional(),
    image: string().optional(),
})
