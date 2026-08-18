import { boolean, object, string } from "zod";

export const BrandSchema = object({
  name: string({ required_error: "Brand name is required" }).min(
    2,
    "Brand name must be at least 2 characters",
  ),
  description: string().optional(),
  imageUrl: string().optional(),
  active: boolean().optional(),
});
