import { boolean, date, nativeEnum, number, object, string } from "zod";
import { discountType } from "../enums";

export const DiscountSchema = object({
    name: string({ required_error: "Name for discount is required" }).min(3, "Name for discount is required"),
    discountValue: number({ required_error: "Discount value is required" }),
    validFrom: string({ required_error: "The valid from date is required" }),
    validTo: string({ required_error: "The valid to date is required" }),
    minimumSpend: number({ required_error: "Minimum spending for discount by customer is required" }).min(1, "Minimum spending for discount is required").optional(),
    usageLimit:string({required_error: "Usage limit is required"}),
    discountType: nativeEnum(discountType), 
    department: string().uuid("Please select a valid department").optional(),
    customer: string().uuid("Please select a valid customer").optional(),
    category: string().uuid("Please select a valid category").optional(),
    product: string().uuid("Please select a valid product").optional(),
    status: boolean().optional(),
});