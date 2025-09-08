import z, { boolean, object, string} from "zod";

export const OrderSchema = object({
    name: string({ message: "Unit name is required" }).min(3,"Please enter a valid unit name"),
   
    status: boolean().optional(),
});


export const orderRequestSchema = object({
  comment: string().optional(),
  customerFirstName: string().min(1, 'First name is required'),
  customerLastName: string().min(1, 'Last name is required'),
  customerPhoneNumber:string().min(1, 'Phone number is required'),
  customerGender: z.enum(['MALE', 'FEMALE'], {
    required_error: 'Gender is required',
  }),
  customerEmailAddress: z.string().email('Valid email address is required'),
//   discount: z.string().uuid().optional(),
//   tableAndSpace: z.string().uuid().optional(),
//   reservation: z.string().uuid().optional(),
  orderRequestItems: z.array(z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
    comment: z.string().optional(),
    variant: z.string().uuid(),
    // discount: z.string().uuid().optional(),
    modifiers: z.array(z.object({
      quantity: z.number().int().positive(),
      modifier: z.string().uuid(),
    })).optional().default([]),
    addons: z.array(z.object({
      quantity: z.number().int().positive(),
      addon: z.string().uuid(),
    })).optional().default([]),
  })).min(1, 'At least one item is required'),
});

export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
