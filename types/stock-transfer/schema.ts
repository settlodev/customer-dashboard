import { array, number, object, preprocess, string } from "zod";

const toNumber = (val: unknown) => {
  if (typeof val === "string" && val.trim() !== "") return parseFloat(val);
  if (typeof val === "number") return val;
  return undefined;
};

export const StockTransferItemSchema = object({
  stockVariantId: string({ required_error: "Stock item is required" }).uuid(),
  quantity: preprocess(toNumber, number({ required_error: "Quantity is required" }).positive("Must be positive")),
});

export const StockTransferSchema = object({
  destinationLocationType: string({ required_error: "Destination type is required" }),
  destinationLocationId: string({ required_error: "Destination is required" }).uuid(),
  transferType: string().optional(),
  transferDate: string().optional(),
  notes: string().optional(),
  items: array(StockTransferItemSchema).min(1, "At least one item is required"),
});
