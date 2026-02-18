import { boolean, object, string, preprocess, number } from "zod";

export const StockTransferSchema = object({
  fromLocation: string({
    message: "Please select a business location ",
  }).uuid(),
  toLocation: string({
    message:
      "Please select a business location where stock will be transferred",
  }).uuid(),
  staff: string({ message: "Please select a staff" }).uuid(),
  stockVariant: string({ message: "Please select a stock variant" }).uuid(),
  quantity: preprocess(
    (val) => {
      if (typeof val === "string" && val.trim() !== "") {
        return parseInt(val);
      }
      return val;
    },
    number({ message: "Quantity is required" })
      .nonnegative({ message: "Quantity can not be negative" })
      .gt(0, { message: "Quantity can not be zero" }),
  ),
  department: string({ message: "Please select a department" })
    .uuid()
    .optional(),
  status: boolean().optional(),
  comment: string().optional(),
});
