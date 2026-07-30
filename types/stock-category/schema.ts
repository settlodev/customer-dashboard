import { boolean, object, string } from "zod";

export const StockCategorySchema = object({
  name: string()
    .min(2, "Stock category name must be at least 2 characters")
    .max(50, "Stock category name can not exceed 50 characters"),
  description: string().optional(),
  active: boolean().optional(),
});
