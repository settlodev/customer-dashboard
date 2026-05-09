import { z } from "zod";

// Schema for the /cart submit-order-request flow. Order list + detail
// views are read-only on the dashboard, so no order-mutation schema
// lives here yet.
export const orderRequestSchema = z.object({
  comment: z.string().optional(),
  customerFirstName: z.string().min(1, "First name is required"),
  customerLastName: z.string().min(1, "Last name is required"),
  customerPhoneNumber: z.string().min(1, "Phone number is required"),
  customerGender: z.enum(["MALE", "FEMALE", "UNDISCLOSED"], {
    required_error: "Gender is required",
  }),
  customerEmailAddress: z.string().email("Valid email address is required"),
  orderRequestItems: z
    .array(
      z.object({
        quantity: z.number().int().positive("Quantity must be positive"),
        comment: z.string().optional(),
        variant: z.string().uuid(),
        modifiers: z
          .array(
            z.object({
              quantity: z.number().int().positive(),
              modifier: z.string().uuid(),
            }),
          )
          .optional()
          .default([]),
        addons: z
          .array(
            z.object({
              quantity: z.number().int().positive(),
              addon: z.string().uuid(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .min(1, "At least one item is required"),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
