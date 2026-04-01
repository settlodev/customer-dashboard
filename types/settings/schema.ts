import * as z from "zod";

export const LocationSettingsSchema = z.object({
  // Operational Toggles
  ecommerceEnabled: z.boolean().default(false),
  orderPrintsCountEnabled: z.boolean().default(false),

  // Notifications
  enableEmailNotifications: z.boolean().default(true),
  enableSmsNotifications: z.boolean().default(true),
  enablePushNotifications: z.boolean().default(true),

  // Docket/Ticket
  showAmountOnDockets: z.boolean().default(false),
  printEachDocketItem: z.boolean().default(false),
  showDocketCount: z.boolean().default(true),
  singleTicketPrint: z.boolean().default(false),
  showPriceOnTicket: z.boolean().default(false),
  autoPrintTickets: z.boolean().default(false),
  allowDuplicateDocketPrinting: z.boolean().default(true),

  // Stock Movement
  deductStockOnItemChange: z.boolean().default(false),
  deductStockOnOrderClose: z.boolean().default(true),
  deductStockOnPartialPay: z.boolean().default(false),

  // Tipping
  allowTipping: z.boolean().default(false),

  // Order Management
  allowOrderRequests: z.boolean().default(true),
  allowCustomPrice: z.boolean().default(false),

  // POS Display
  showPosProductPrice: z.boolean().default(true),
  showPosProductQuantity: z.boolean().default(true),

  // Operations
  useShifts: z.boolean().default(false),
  usePasscodes: z.boolean().default(false),
  enableDigitalMenu: z.boolean().default(false),
  currency: z.string().min(1).max(5).default("TZS"),
  minimumOrderAmount: z.number().min(0).nullable().default(null),
  maxDiscountPercentage: z.number().min(0).max(100).nullable().default(null),
  autoCloseOrderMinutes: z.number().min(1).nullable().default(null),
  autoCloseOrderWhenFullyPaid: z.boolean().default(false),
  autoOpenCashDrawer: z.boolean().default(false),
  discountApprovalThreshold: z.number().min(0).max(100).nullable().default(null),
  enableTableManagement: z.boolean().default(true),
  orderingMode: z.string().default("STANDARD"),
  receiptCopies: z.number().min(1).max(10).default(1),
  enableKitchenDisplay: z.boolean().default(false),
  enableLoyaltyProgram: z.boolean().default(false),

  // Order Naming
  orderNamePrefix: z.string().max(50).default("Order"),
  includeDateInOrderName: z.boolean().default(true),
  orderNumberStart: z.number().min(1).default(1),
  orderNumberPadding: z.number().min(1).max(10).default(4),
  showOrderNumberPrefix: z.boolean().default(true),

  // Receipt Configuration
  receiptHeaderImageUrl: z.string().max(500).nullable().default(null),
  receiptNumberPrefix: z.string().max(50).nullable().default(null),
  receiptNumberSuffix: z.string().max(50).nullable().default(null),
  receiptBusinessName: z.string().max(200).nullable().default(null),
  receiptHeaderText: z.string().nullable().default(null),
  receiptPaymentDetails: z.string().nullable().default(null),
  physicalReceiptPaymentDetails: z.string().nullable().default(null),
  digitalReceiptPaymentDetails: z.string().nullable().default(null),
  receiptFooterText: z.string().nullable().default(null),
  includePaymentDetailsOnReceipt: z.boolean().default(true),
  showItemizedReceipt: z.boolean().default(true),
  showTaxOnReceipt: z.boolean().default(true),
  showDiscountOnReceipt: z.boolean().default(true),
  showStaffOnReceipt: z.boolean().default(true),
  showCustomerOnReceipt: z.boolean().default(true),
  showImageOnReceipt: z.boolean().default(false),
  showAdditionalDetailsOnPhysicalReceipt: z.boolean().default(false),
  showAdditionalDetailsOnDigitalReceipt: z.boolean().default(false),
  showQrCodeOnReceipt: z.boolean().default(false),
  receiptQrCodeUrl: z.string().max(500).nullable().default(null),
  autoPrintReceipt: z.boolean().default(false),
  autoEmailReceipt: z.boolean().default(false),
  autoSmsReceipt: z.boolean().default(false),

  // Invoice
  invoiceNumberPrefix: z.string().max(50).default("INV"),
  includeDateInInvoiceNumber: z.boolean().default(true),
  companyRegistrationNumber: z.string().max(100).nullable().default(null),
  taxIdentificationNumber: z.string().max(100).nullable().default(null),
  defaultPaymentTerms: z.string().max(100).nullable().default(null),
  defaultInvoiceDueDays: z.number().min(0).default(30),

  // Tax
  pricesIncludeTax: z.boolean().default(true),
  defaultTaxRate: z.number().min(0).max(100).default(18.0),
  taxLabel: z.string().max(50).default("VAT"),

  // Customer Loyalty
  customerLoyaltyAwardType: z.string().default("PER_ORDER"),
  customerLoyaltyPointsPerOrder: z.number().min(0).default(1),
  customerLoyaltyPointsPerValue: z.number().min(0).default(1),
  customerLoyaltyValueThreshold: z.number().min(0).default(1000),
  customerLoyaltyMinimumRedeemablePoints: z.number().min(0).default(100),

  // Staff Points
  enableStaffPoints: z.boolean().default(false),
  staffPointsAwardType: z.string().default("PER_ORDER"),
  staffPointsPerOrder: z.number().min(0).default(1),
  staffPointsPerValue: z.number().min(0).default(1),
  staffPointsValueThreshold: z.number().min(0).default(1000),
  staffMinimumRedeemablePoints: z.number().min(0).default(100),
  staffPointsRecipient: z.string().default("FINISHED_BY"),

  // Day Sessions
  enableDaySessions: z.boolean().default(false),
  autoOpenDay: z.boolean().default(false),
  autoCloseDay: z.boolean().default(false),

  // Inventory Flags
  batchTrackingEnabled: z.boolean().default(true),
  qualityInspectionEnabled: z.boolean().default(false),
  autoReorderEnabled: z.boolean().default(false),
  autoClosingEnabled: z.boolean().default(false),
  warehouseManagementEnabled: z.boolean().default(false),
  cycleCountingEnabled: z.boolean().default(false),
  consumptionRulesEnabled: z.boolean().default(false),
  expiryAlertDays: z.number().min(1).max(365).default(7),
  reservationExpiryMinutes: z.number().min(1).max(1440).default(30),
  rfqEnabled: z.boolean().default(false),

  // Location Notifications
  lowStockAlertEmail: z.string().max(255).nullable().default(null),
  dailyReportEmail: z.string().max(255).nullable().default(null),
  alertPhoneNumber: z.string().max(20).nullable().default(null),
  sendDailySalesEmail: z.boolean().default(false),
  sendWeeklySalesEmail: z.boolean().default(false),

  // Settlement
  minimumSettlementAmount: z.number().min(0).nullable().default(null),
  autoCloseBusinessDays: z.boolean().default(false),

  // Operating Hours
  operatingHours: z.array(z.object({
    dayOfWeek: z.string(),
    openTime: z.string().nullable(),
    closeTime: z.string().nullable(),
    closed: z.boolean(),
  })).optional().default([]),

  // System flags
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  status: z.boolean().default(true),
  canDelete: z.boolean().default(true),
  isArchived: z.boolean().default(false),
});
