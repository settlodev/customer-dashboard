import * as z from "zod";

export const LocationSettingsSchema = z.object({
  // Basic settings
  minimumSettlementAmount: z.number().min(0).default(0),
  systemPasscode: z.string().min(4).max(10).default("0000"),
  reportsPasscode: z.string().min(4).max(10).default("0000"),

  // Feature settings
  trackInventory: z.boolean().default(false),
  ecommerceEnabled: z.boolean().default(false),
  useRecipe: z.boolean().default(false),
  usePasscode: z.boolean().default(false),
  useDepartments: z.boolean().default(false),
  useCustomPrice: z.boolean().default(false),
  useWarehouse: z.boolean().default(false),
  useShifts: z.boolean().default(false),
  useKds: z.boolean().default(false),
  enableOrdersPrintsCount: z.boolean().default(true),
  showPosProductQuantity: z.boolean().default(true),
  showPosProductPrice: z.boolean().default(true),

  // Printing settings
  printEachTicketItem: z.boolean().default(false),
  ticketToHaveAmount: z.boolean().default(false),
  singleTicketPrint: z.boolean().default(false),
  showPriceOnTicket: z.boolean().default(false),

  // Inventory settings
  deductStockOnItemChange: z.boolean().default(true),
  deductStockOnOrderClose: z.boolean().default(false),
  deductStockOnPartialPay: z.boolean().default(false),

  // Notification settings
  enableNotifications: z.boolean().default(false),
  enableEmailNotifications: z.boolean().default(true),
  enableSmsNotifications: z.boolean().default(true),
  enablePushNotifications: z.boolean().default(true),
  allowTipping: z.boolean().default(false),

  // System settings
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  status: z.boolean().default(true),
  canDelete: z.boolean().default(true),
  isArchived: z.boolean().default(false),

  // Receipt settings
  showQrCodeOnReceipt: z.boolean().default(false),
  showImageOnReceipt: z.boolean().default(false),
  showAdditionalDetailsOnPhysicalReceipt: z.boolean().default(false),
  showAdditionalDetailsOnDigitalReceipt: z.boolean().default(false),
});
