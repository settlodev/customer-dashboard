import { boolean, number, object, string } from "zod";
export const ProformaSchema = object({
  customer: string({ required_error: "Customer is required" }).min(
    3,
    "Please select a valid customer",
  ),
});
export const AddItemsToProformaSchema = object({
  productVariantId: string({ required_error: "Customer is required" }).min(
    3,
    "Please select a valid customer",
  ),
  quantity: number({ required_error: "Quantity is required" }),
});

export const UpdateProformaSchema = object({
  notes: string().optional().default(""),
  discount: string().optional().default(""),
  manualDiscountAmount: number().min(0).default(0),
  expiresAt: string().optional().default(""),
  showTaxAmounts: boolean(),
});
