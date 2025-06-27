import {array, boolean, coerce, date, object, string} from "zod";

export const PurchaseProductSchema = object({
    product: string({ required_error: "Product is required" })
      .uuid("Please select a valid product"),
    quantity: coerce.number({ required_error: "Quantity is required" })
      .positive("Quantity must be positive"),
    price: coerce.number({ required_error: "Price is required" })
      .positive("Price must be positive"),
  });
  
  // Main purchase schema
  export const PurchaseSchema = object({
    date: string({ required_error: "Date is required" }),
    supplier: string({ required_error: "Supplier is required" })
      .uuid("Please select a valid supplier"),
    products: array(PurchaseProductSchema)
      .min(1, "At least one product is required"),
    note: string().optional(),
  });