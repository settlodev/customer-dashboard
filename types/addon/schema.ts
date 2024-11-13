import { boolean, number, object, preprocess, string } from "zod";

export const AddonSchema = object({
    title: string({ message: "Addon name is required" }).min(3,"Please enter a valid addon name"),
    price:preprocess(
        (val) => {
          if (typeof val === "string" && val.trim() !== "") {
            return parseInt(val);
          }
      
          return val;
        },
        number({ message: "Please addon price should be valid number" })
          .nonnegative({ message: "Please addon price should be positive number" })
    ),
    addonTracking:boolean(),
    stockVariant:string().uuid("Please select a valid stock variant").optional(),
    stock:string().optional(),
    product:string().optional(),
    productVariant:string().uuid("Please select a valid product variant").optional(),
    status: boolean().optional(),
});