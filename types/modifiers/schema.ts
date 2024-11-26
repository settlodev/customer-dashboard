import { array, boolean, number, object, string } from "zod";

export const ModifierItemSchema = object({
  name: string({ message: "Please add an item" })
            .min(1, "Item name is required"), // Validate item name
  price: number({ message: "Price is required" })
      .nonnegative({ message: "Price must be must greater or equal to zero" }) 
})

export const ModifierSchema = object({
  name: string({ message: "Modifier group name is required" }).min(3, "Please enter a valid modifier group name"),
  modifierItems: ModifierItemSchema.array().min(1, "At least one item must be added"),
  variant: string().uuid("Please select a valid product variant"),
  isMandatory: boolean().optional(),
  isMaximum: boolean().optional(),
  maximumSelection: number().optional(),
  status: boolean().optional(),
});

