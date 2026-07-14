import * as z from "zod";

export const OnlineMenuSchema = z.object({
  name: z.string().min(1, "Menu name is required").max(255),
  description: z.string().max(500).optional().or(z.literal("")),
  image: z.string().max(500).optional().or(z.literal("")),
});

export const MenuSettingsSchema = z.object({
  menuVisible: z.boolean().optional(),
  orderingStatus: z.enum(["ACTIVE", "PAUSED", "CLOSED"]).optional(),
  pickupEnabled: z.boolean().optional(),
  deliveryEnabled: z.boolean().optional(),
  dineInEnabled: z.boolean().optional(),
  qrOrderingEnabled: z.boolean().optional(),
  tableOrderingEnabled: z.boolean().optional(),
  allowCustomersToJoinTableOrders: z.boolean().optional(),
  qrIncludesTableCode: z.boolean().optional(),
  customerAccountsEnabled: z.boolean().optional(),
  allowGuestCheckout: z.boolean().optional(),
  allowEmailLogin: z.boolean().optional(),
  allowPhoneOtpLogin: z.boolean().optional(),
  saveCustomerDetails: z.boolean().optional(),
  allowReorder: z.boolean().optional(),
  autoCreateTableSession: z.boolean().optional(),
  allowMultipleOrdersPerTable: z.boolean().optional(),
  allowCustomersToViewCurrentTableOrder: z.boolean().optional(),
  payAtTableEnabled: z.boolean().optional(),
  splitBillEnabled: z.boolean().optional(),
  minimumOrderAmount: z.number().min(0).nullable().optional(),
  maximumOrderAmount: z.number().min(0).nullable().optional(),
  maxItemsPerOrder: z.number().int().min(1).nullable().optional(),
  deliveryFee: z.number().min(0).nullable().optional(),
  deliveryRadiusKm: z.number().int().min(1).nullable().optional(),
  defaultPrepTimeMinutes: z.number().int().min(1).nullable().optional(),
  maxPrepTimeMinutes: z.number().int().min(1).nullable().optional(),
  allowScheduledOrders: z.boolean().optional(),
  maxScheduleDaysAhead: z.number().int().min(1).nullable().optional(),
  maxOrdersPerTimeSlot: z.number().int().min(1).nullable().optional(),
  timeSlotMinutes: z.number().int().min(1).nullable().optional(),
  allowOnlinePayment: z.boolean().optional(),
  allowCashOnPickup: z.boolean().optional(),
  allowCashOnDelivery: z.boolean().optional(),
  rateLimitPerMinute: z.number().int().min(1).nullable().optional(),
  maxOrdersPerCustomerPerHour: z.number().int().min(1).nullable().optional(),
  pausedMessage: z.string().max(300).nullable().optional(),
  closedMessage: z.string().max(300).nullable().optional(),
});

export type OnlineMenuFormData = z.infer<typeof OnlineMenuSchema>;
export type MenuSettingsFormData = z.infer<typeof MenuSettingsSchema>;
