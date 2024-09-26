import {boolean, object, string} from "zod";

export const CategorySchema = object({
    id: string(),
    name: string(),
    image: string(),
    parentId: string(),
    status: boolean(),
    canDelete: boolean(),
    location: string(),
    isArchived: boolean()
});
