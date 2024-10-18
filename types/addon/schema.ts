import { boolean, number, object, preprocess, string } from "zod";

export const AddonSchema = object({
    title: string({ message: "Addon name is required" }).min(3,"Please enter a valid addon/ name"),
    price:preprocess(
        (val) => {
          if (typeof val === "string" && val.trim() !== "") {
            return parseInt(val);
          }
      
          return val;
        },
        number({ message: "Please brand price should be valid number" })
          .nonnegative({ message: "Please brand price should be positive number" })
          .gt(0, { message: "Please brand price should be greater than 0" }),
    ),
    status: boolean().optional(),
});