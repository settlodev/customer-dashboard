import { boolean, object, string } from "zod";

export const BrandSchema = object({
    name: string({ required_error: "Brand name is required" }).min(3,"Please enter a valid brand name"),
    status: boolean().optional(),
});