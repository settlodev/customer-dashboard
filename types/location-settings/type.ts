// Mirrors the backend LocationSettingsResponse + UpdateLocationSettingsRequest
// from Settlo Accounts Service (`/api/v1/locations/{locationId}/settings`).
//
// Every field is optional on the wire for update, but the response is fully
// populated — we keep nullable shapes for writes and non-nullable for the
// read type so form state stays simple.

export type OrderingMode = "STANDARD" | "TABLE_MANAGEMENT";
export type LoyaltyAwardType = "PER_ORDER" | "PER_ORDER_VALUE";
export type StaffPointsRecipient = "FINISHED_BY" | "ASSIGNED_TO" | "SPLIT";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface OperatingHours {
  dayOfWeek: DayOfWeek;
  openTime: string | null; // HH:mm
  closeTime: string | null;
  closed: boolean;
}

export interface LocationSettings {
  id: string;
  accountId: string;
  locationId: string;
  locationName: string | null;

  // Operational toggles
  ecommerceEnabled: boolean;
  orderPrintsCountEnabled: boolean;

  // Notification toggles
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;

  // Docket / ticket
  showAmountOnDockets: boolean;
  printEachDocketItem: boolean;
  showDocketCount: boolean;
  singleTicketPrint: boolean;
  showPriceOnTicket: boolean;
  autoPrintTickets: boolean;
  allowDuplicateDocketPrinting: boolean;

  // Stock deduction
  deductStockOnItemChange: boolean;
  deductStockOnOrderClose: boolean;
  deductStockOnPartialPay: boolean;

  // Payment & tipping
  allowTipping: boolean;

  // Order management
  allowOrderRequests: boolean;
  allowCustomPrice: boolean;

  // POS display
  showPosProductPrice: boolean;
  showPosProductQuantity: boolean;

  // Operational
  useShifts: boolean;
  usePasscodes: boolean;
  enableDigitalMenu: boolean;

  // Currency
  currency: string;

  // Additional
  minimumOrderAmount: number | null;
  maxDiscountPercentage: number | null;
  autoCloseOrderMinutes: number | null;
  autoCloseOrderWhenFullyPaid: boolean;
  autoOpenCashDrawer: boolean;
  discountApprovalThreshold: number | null;
  enableTableManagement: boolean;
  orderingMode: OrderingMode;
  receiptCopies: number;
  enableKitchenDisplay: boolean;
  enableLoyaltyProgram: boolean;

  // Receipt display
  showImageOnReceipt: boolean;
  showAdditionalDetailsOnPhysicalReceipt: boolean;
  showAdditionalDetailsOnDigitalReceipt: boolean;

  // Customer loyalty
  customerLoyaltyAwardType: LoyaltyAwardType;
  customerLoyaltyPointsPerOrder: number;
  customerLoyaltyPointsPerValue: number;
  customerLoyaltyValueThreshold: number | null;
  customerLoyaltyMinimumRedeemablePoints: number;

  // Staff points
  enableStaffPoints: boolean;
  staffPointsAwardType: LoyaltyAwardType;
  staffPointsPerOrder: number;
  staffPointsPerValue: number;
  staffPointsValueThreshold: number | null;
  staffMinimumRedeemablePoints: number;
  staffPointsRecipient: StaffPointsRecipient;

  // Point expiration
  enablePointExpiration: boolean;
  pointExpirationDays: number;

  // Day sessions
  enableDaySessions: boolean;
  autoOpenDay: boolean;
  autoCloseDay: boolean;

  // Inventory feature flags (mirrored onto Inventory Service LocationConfig)
  batchTrackingEnabled: boolean;
  qualityInspectionEnabled: boolean;
  autoReorderEnabled: boolean;
  autoClosingEnabled: boolean;
  warehouseManagementEnabled: boolean;
  cycleCountingEnabled: boolean;
  consumptionRulesEnabled: boolean;
  expiryAlertDays: number | null;
  reservationExpiryMinutes: number | null;
  rfqEnabled: boolean;

  // Order naming
  orderNamePrefix: string | null;
  includeDateInOrderName: boolean;
  orderNumberStart: number;
  orderNumberPadding: number;
  showOrderNumberPrefix: boolean;

  // Receipt
  receiptHeaderImageUrl: string | null;
  receiptNumberPrefix: string | null;
  receiptNumberSuffix: string | null;
  receiptBusinessName: string | null;
  receiptHeaderText: string | null;
  receiptPaymentDetails: string | null;
  physicalReceiptPaymentDetails: string | null;
  digitalReceiptPaymentDetails: string | null;
  receiptFooterText: string | null;
  includePaymentDetailsOnReceipt: boolean;
  showItemizedReceipt: boolean;
  showTaxOnReceipt: boolean;
  showDiscountOnReceipt: boolean;
  showStaffOnReceipt: boolean;
  showCustomerOnReceipt: boolean;
  showQrCodeOnReceipt: boolean;
  receiptQrCodeUrl: string | null;
  autoPrintReceipt: boolean;
  autoEmailReceipt: boolean;
  autoSmsReceipt: boolean;

  // Invoice
  invoiceNumberPrefix: string | null;
  includeDateInInvoiceNumber: boolean;
  companyRegistrationNumber: string | null;
  taxIdentificationNumber: string | null;
  defaultPaymentTerms: string | null;
  defaultInvoiceDueDays: number | null;

  // Tax
  pricesIncludeTax: boolean;
  defaultTaxRate: number | null;
  taxLabel: string | null;

  // Notification addresses
  lowStockAlertEmail: string | null;
  dailyReportEmail: string | null;
  alertPhoneNumber: string | null;
  sendDailySalesEmail: boolean;
  sendWeeklySalesEmail: boolean;

  // Settlement
  minimumSettlementAmount: number | null;
  autoCloseBusinessDays: boolean;

  // Operating hours
  operatingHours: OperatingHours[];

  createdAt: string;
  updatedAt: string;
}

// ── Display helpers ────────────────────────────────────────────────

export const ORDERING_MODE_OPTIONS: { value: OrderingMode; label: string }[] = [
  { value: "STANDARD", label: "Standard orders" },
  { value: "TABLE_MANAGEMENT", label: "Orders around tables" },
];

export const LOYALTY_AWARD_TYPE_OPTIONS: { value: LoyaltyAwardType; label: string }[] = [
  { value: "PER_ORDER", label: "Fixed per order" },
  { value: "PER_ORDER_VALUE", label: "Scaled by order value" },
];

export const STAFF_POINTS_RECIPIENT_OPTIONS: { value: StaffPointsRecipient; label: string }[] = [
  { value: "FINISHED_BY", label: "Staff who closed the order" },
  { value: "ASSIGNED_TO", label: "Staff the order was assigned to" },
  { value: "SPLIT", label: "Split between assigned and closing" },
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};
