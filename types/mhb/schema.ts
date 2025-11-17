import { object, string } from "zod";

export const TanqrSchema = object({
  merchantName: string().min(1, "Merchant name is required"),

  emailAddress: string().email("Invalid email address").toLowerCase(),
});
