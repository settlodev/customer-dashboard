// import { z } from "zod";

// export const InvoiceSchema = z.object({
//   locationSubscriptions: z.array(
//     z.object({
//       locationId: z.string().uuid("Invalid location ID"), 
//       locationSubscriptionPackageId: z.union([
//         z.string().min(1, "Subscription is required"),
//         z.object({ id: z.string().uuid() }).passthrough(),
//       ]),
//       subscriptionDurationType: z.string(),
//       subscriptionDurationCount: z.number().min(1, "Number of months must be at least 1 month"),
//       attachSubscriptionAddon: z.boolean(),
//       locationSubscriptionDiscountId: z.string().uuid().optional(),
//     })
//   ),
//   locationAddons: z.array(
//     z.object({
//       subscriptionAddon: z.string().uuid("Invalid addon ID"),
//     })
//   ).optional(),
//   email: z.string().email("Not a valid email").optional(),
//   phone: z.string().optional(),
//   discountCode: z.string().optional(),
//   discountAmount: z.number().min(0).optional(),
// });

import { z } from "zod";

export const InvoiceSchema = z.object({
  locationSubscriptions: z.array(
    z.object({
      locationId: z.string().uuid("Invalid location ID"), 
      locationSubscriptionPackageId: z.union([
        z.string().min(1, "Subscription is required"),
        z.object({ id: z.string().uuid() }).passthrough(),
      ]),
      subscriptionDurationType: z.string(),
      subscriptionDurationCount: z.number().min(1, "Number of months must be at least 1 month"),
      attachSubscriptionAddon: z.boolean(),
      locationSubscriptionDiscountId: z.string().uuid().optional(),
    })
  ).optional(), // Make this optional since we might have only addons
  locationAddons: z.array(
    z.object({
      subscriptionAddon: z.string().uuid("Invalid addon ID"),
    })
  ).optional(),
  locationFreeStandingAddonSubscriptions: z.array(
    z.object({
      targetedLocationSubscriptionId: z.string().uuid("Invalid subscription ID"),
      
    })
  ).optional(),
  email: z.string().email("Not a valid email").optional(),
  phone: z.string().optional(),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
});