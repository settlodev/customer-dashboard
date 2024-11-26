import { array, boolean, number, object, string } from "zod";

const stockVariantsSchema = object({
  id: string().uuid("Please select a valid stock variant"),
  quantity: number().nonnegative("Quantity must be a positive number"),
});

export const RecipeSchema = object({
  name: string({ message: "Recipe name is required" }).min(3, "Please enter a valid recipe name"),
  stockVariants: stockVariantsSchema.array().min(1, "At least one stock variant must be added").optional(),
  variant: string().uuid("Please select a valid product variant"),
  status: boolean().optional(),
});
