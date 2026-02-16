import { z } from "zod";

export const updatePaymentMethodsSchema = z.object({
  newAcceptedPaymentMethodTypeIds: z.array(z.string().uuid()).min(1),
});
