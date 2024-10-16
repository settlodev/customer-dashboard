import { boolean, object, string } from "zod";

export const SpaceSchema = object({
    name: string({
        required_error: "Name of space is required",
    }).min(3, "Name of space should be at least 3 characters").max(50, "Name of space can not be more than 50 characters"),
    status: boolean().optional(),
})