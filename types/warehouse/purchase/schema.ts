import {coerce,object} from "zod";

  export const PurchaseSchema = object({
    amount: coerce.number({
      invalid_type_error: "Amount is required",
      required_error: "Amount is required",
    }),
   
  });