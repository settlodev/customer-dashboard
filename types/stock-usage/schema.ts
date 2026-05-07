import { number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockUsageSchema = object({
  stockVariantId: string({ required_error: "Select stock item" }).uuid({
    message: "Select stock item",
  }),
  quantity: preprocess(
    toNumber,
    number({ required_error: "Quantity is required" })
      .positive("Quantity must be greater than zero"),
  ),
  usageType: string({ required_error: "Usage type is required" }),
  departmentId: string({ required_error: "Department is required" }).uuid({
    message: "Select department",
  }),
  notes: string().optional(),
  usageDate: string().optional(),
});
