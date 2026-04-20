import { z } from "zod";

const toNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const toInt = (val: unknown) => {
  const n = toNumber(val);
  return n === undefined ? undefined : Math.trunc(n);
};

const currencyCode = z
  .string()
  .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO code")
  .transform((v) => v.toUpperCase());

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be HH:mm");

export const OperatingHoursSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  openTime: hhmm.optional().nullable(),
  closeTime: hhmm.optional().nullable(),
  closed: z.boolean().default(false),
});

// Every section-level schema is pickable from this master — each settings panel
// validates only the fields it edits. The action layer merges submissions into
// UpdateLocationSettingsRequest at send time.

export const LocationSettingsSchema = z.object({
  // Profile
  currency: currencyCode.optional(),
  operatingHours: z.array(OperatingHoursSchema).optional(),

  // Orders & POS
  orderingMode: z.enum(["STANDARD", "TABLE_MANAGEMENT"]).optional(),
  enableTableManagement: z.boolean().optional(),
  enableKitchenDisplay: z.boolean().optional(),
  allowTipping: z.boolean().optional(),
  allowOrderRequests: z.boolean().optional(),
  allowCustomPrice: z.boolean().optional(),
  showPosProductPrice: z.boolean().optional(),
  showPosProductQuantity: z.boolean().optional(),
  useShifts: z.boolean().optional(),
  usePasscodes: z.boolean().optional(),
  enableDigitalMenu: z.boolean().optional(),
  ecommerceEnabled: z.boolean().optional(),
  autoOpenCashDrawer: z.boolean().optional(),
  autoCloseOrderWhenFullyPaid: z.boolean().optional(),
  autoCloseOrderMinutes: z.preprocess(toInt, z.number().int().min(1).optional()),
  minimumOrderAmount: z.preprocess(toNumber, z.number().min(0).optional()),
  maxDiscountPercentage: z.preprocess(toNumber, z.number().min(0).max(100).optional()),
  discountApprovalThreshold: z.preprocess(toNumber, z.number().min(0).max(100).optional()),
  receiptCopies: z.preprocess(toInt, z.number().int().min(1).max(10).optional()),

  // Order naming
  orderNamePrefix: z.string().max(50).optional(),
  includeDateInOrderName: z.boolean().optional(),
  orderNumberStart: z.preprocess(toInt, z.number().int().min(1).optional()),
  orderNumberPadding: z.preprocess(toInt, z.number().int().min(1).max(10).optional()),
  showOrderNumberPrefix: z.boolean().optional(),

  // Dockets
  showAmountOnDockets: z.boolean().optional(),
  printEachDocketItem: z.boolean().optional(),
  showDocketCount: z.boolean().optional(),
  singleTicketPrint: z.boolean().optional(),
  showPriceOnTicket: z.boolean().optional(),
  autoPrintTickets: z.boolean().optional(),
  allowDuplicateDocketPrinting: z.boolean().optional(),
  orderPrintsCountEnabled: z.boolean().optional(),

  // Receipt
  receiptHeaderImageUrl: z.string().max(500).optional(),
  receiptNumberPrefix: z.string().max(50).optional(),
  receiptNumberSuffix: z.string().max(50).optional(),
  receiptBusinessName: z.string().max(200).optional(),
  receiptHeaderText: z.string().optional(),
  receiptPaymentDetails: z.string().optional(),
  physicalReceiptPaymentDetails: z.string().optional(),
  digitalReceiptPaymentDetails: z.string().optional(),
  receiptFooterText: z.string().optional(),
  includePaymentDetailsOnReceipt: z.boolean().optional(),
  showItemizedReceipt: z.boolean().optional(),
  showTaxOnReceipt: z.boolean().optional(),
  showDiscountOnReceipt: z.boolean().optional(),
  showStaffOnReceipt: z.boolean().optional(),
  showCustomerOnReceipt: z.boolean().optional(),
  showQrCodeOnReceipt: z.boolean().optional(),
  receiptQrCodeUrl: z.string().max(500).optional(),
  showImageOnReceipt: z.boolean().optional(),
  showAdditionalDetailsOnPhysicalReceipt: z.boolean().optional(),
  showAdditionalDetailsOnDigitalReceipt: z.boolean().optional(),
  autoPrintReceipt: z.boolean().optional(),
  autoEmailReceipt: z.boolean().optional(),
  autoSmsReceipt: z.boolean().optional(),

  // Invoice
  invoiceNumberPrefix: z.string().max(50).optional(),
  includeDateInInvoiceNumber: z.boolean().optional(),
  companyRegistrationNumber: z.string().max(100).optional(),
  taxIdentificationNumber: z.string().max(100).optional(),
  defaultPaymentTerms: z.string().max(100).optional(),
  defaultInvoiceDueDays: z.preprocess(toInt, z.number().int().min(0).optional()),

  // Tax
  pricesIncludeTax: z.boolean().optional(),
  defaultTaxRate: z.preprocess(toNumber, z.number().min(0).max(100).optional()),
  taxLabel: z.string().max(50).optional(),

  // Notifications
  enableEmailNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  enablePushNotifications: z.boolean().optional(),
  lowStockAlertEmail: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  dailyReportEmail: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  alertPhoneNumber: z.string().max(20).optional(),
  sendDailySalesEmail: z.boolean().optional(),
  sendWeeklySalesEmail: z.boolean().optional(),

  // Loyalty
  enableLoyaltyProgram: z.boolean().optional(),
  customerLoyaltyAwardType: z.enum(["PER_ORDER", "PER_ORDER_VALUE"]).optional(),
  customerLoyaltyPointsPerOrder: z.preprocess(toInt, z.number().int().min(1).max(10000).optional()),
  customerLoyaltyPointsPerValue: z.preprocess(toInt, z.number().int().min(1).max(10000).optional()),
  customerLoyaltyValueThreshold: z.preprocess(toNumber, z.number().min(1).optional()),
  customerLoyaltyMinimumRedeemablePoints: z.preprocess(toInt, z.number().int().min(0).optional()),
  enableStaffPoints: z.boolean().optional(),
  staffPointsAwardType: z.enum(["PER_ORDER", "PER_ORDER_VALUE"]).optional(),
  staffPointsPerOrder: z.preprocess(toInt, z.number().int().min(1).max(10000).optional()),
  staffPointsPerValue: z.preprocess(toInt, z.number().int().min(1).max(10000).optional()),
  staffPointsValueThreshold: z.preprocess(toNumber, z.number().min(1).optional()),
  staffMinimumRedeemablePoints: z.preprocess(toInt, z.number().int().min(0).optional()),
  staffPointsRecipient: z.enum(["FINISHED_BY", "ASSIGNED_TO", "SPLIT"]).optional(),
  enablePointExpiration: z.boolean().optional(),
  pointExpirationDays: z.preprocess(toInt, z.number().int().min(1).max(3650).optional()),

  // Stock / inventory flags
  deductStockOnItemChange: z.boolean().optional(),
  deductStockOnOrderClose: z.boolean().optional(),
  deductStockOnPartialPay: z.boolean().optional(),
  batchTrackingEnabled: z.boolean().optional(),
  qualityInspectionEnabled: z.boolean().optional(),
  autoReorderEnabled: z.boolean().optional(),
  autoClosingEnabled: z.boolean().optional(),
  warehouseManagementEnabled: z.boolean().optional(),
  cycleCountingEnabled: z.boolean().optional(),
  consumptionRulesEnabled: z.boolean().optional(),
  expiryAlertDays: z.preprocess(toInt, z.number().int().min(1).max(365).optional()),
  reservationExpiryMinutes: z.preprocess(toInt, z.number().int().min(1).max(1440).optional()),
  rfqEnabled: z.boolean().optional(),

  // Day sessions
  enableDaySessions: z.boolean().optional(),
  autoOpenDay: z.boolean().optional(),
  autoCloseDay: z.boolean().optional(),
  autoCloseBusinessDays: z.boolean().optional(),
  minimumSettlementAmount: z.preprocess(toNumber, z.number().min(0).optional()),
});

/** Writable payload shape — equivalent to UpdateLocationSettingsRequest. */
export type LocationSettingsUpdate = z.infer<typeof LocationSettingsSchema>;
