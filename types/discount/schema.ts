import { boolean, date, nativeEnum, number, object, string } from "zod";
import { discountType } from "../enums";

export const DiscountSchema = object({
  name: string({ required_error: "Name for discount is required" }).min(
    3,
    "Name for discount is required",
  ),
  discountValue: number({ required_error: "Discount value is required" }),
  validFrom: date({ required_error: "The valid from date is required" }),
  validTo: date({ required_error: "The valid to date is required" }),
  minimumSpend: number({
    required_error: "Minimum spending for discount by customer is required",
  })
    .min(1, "Minimum spending for discount is required")
    .optional(),
  usageLimit: string({ required_error: "Usage limit is required" }),
  discountType: nativeEnum(discountType),
  department: string()
    .uuid("Please select a valid department")
    .nullable()
    .optional(),
  customer: string()
    .uuid("Please select a valid customer")
    .nullable()
    .optional(),
  category: string()
    .uuid("Please select a valid category")
    .nullable()
    .optional(),
  product: string().uuid("Please select a valid product").nullable().optional(),
  status: boolean().optional(),
});
