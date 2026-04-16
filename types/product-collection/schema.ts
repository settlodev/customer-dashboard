import { array, boolean, object, string } from "zod";

export const ProductCollectionSchema = object({
  name: string({ required_error: "Collection name is required" }).min(
    2,
    "Name must be at least 2 characters",
  ),
  description: string().optional(),
  imageUrl: string().optional(),
  active: boolean().optional(),
  productIds: array(string().uuid())
    .min(1, "A collection must have at least one product"),
});
