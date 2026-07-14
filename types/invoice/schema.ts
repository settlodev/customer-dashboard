import { array, boolean, number, object, string, union, z } from "zod";

export const InvoiceSchema = object({
  locationSubscriptions: array(
    object({
      locationId: string().uuid("Invalid location ID"), 
      locationSubscriptionPackageId: union([
        string().min(1, "Subscription is required"),
        object({ id: string().uuid() }).passthrough(),
      ]),
      subscriptionDurationType: string(),
      subscriptionDurationCount: number().min(1, "Number of months must be at least 1 month"),
      attachSubscriptionAddon: boolean(),
      locationSubscriptionDiscountId: string().uuid().optional(),
    })
  ).optional(), 
  locationAddons: array(
    object({
      subscriptionAddon: string().uuid("Invalid addon ID"),
    })
  ).optional(),
  locationFreeStandingAddonSubscriptions: array(
    object({
      targetedLocationSubscriptionId: string().uuid("Invalid subscription ID"),
    })
  ).optional(),
  
  warehouseSubscriptions: array(
    object({
      warehouseId: string().uuid("Invalid Warehouse ID"), 
      warehouseSubscriptionPackageId: union([
        string().min(1, "Subscription is required"),
        object({ id: z.string().uuid() }).passthrough(),
      ]),
      subscriptionDurationCount: number().min(1, "Number of months must be at least 1 month"),
      subscriptionDurationType: string(),
      subscriptionDiscount: string().uuid().optional(),
    })
  ).optional(), 
  email: z.string().email("Not a valid email").optional(),
  phone: z.string().optional(),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
});