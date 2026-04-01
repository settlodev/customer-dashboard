import { UUID } from "node:crypto";

export interface BankDetail {
  id: string;
  accountNumber: string;
  accountName: string;
}

export interface MNODetail {
  id: string;
  phoneNumber: string;
  accountName: string;
}

export interface PaymentDetails {
  bankDetails: BankDetail[];
  mnoDetails: MNODetail[];
}

export interface OperatingHour {
  dayOfWeek: string;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
}

export interface LocationSettings {
  id: UUID;

  // Operational Toggles
  ecommerceEnabled: boolean;
  orderPrintsCountEnabled: boolean;

  // Notifications
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;

  // Docket/Ticket
  showAmountOnDockets: boolean;
  printEachDocketItem: boolean;
  showDocketCount: boolean;
  singleTicketPrint: boolean;
  showPriceOnTicket: boolean;
  autoPrintTickets: boolean;
  allowDuplicateDocketPrinting: boolean;

  // Stock Movement
  deductStockOnItemChange: boolean;
  deductStockOnOrderClose: boolean;
  deductStockOnPartialPay: boolean;

  // Tipping
  allowTipping: boolean;

  // Order Management
  allowOrderRequests: boolean;
  allowCustomPrice: boolean;

  // POS Display
  showPosProductPrice: boolean;
  showPosProductQuantity: boolean;

  // Operations
  useShifts: boolean;
  usePasscodes: boolean;
  enableDigitalMenu: boolean;
  currency: string;
  minimumOrderAmount: number | null;
  maxDiscountPercentage: number | null;
  autoCloseOrderMinutes: number | null;
  autoCloseOrderWhenFullyPaid: boolean;
  autoOpenCashDrawer: boolean;
  discountApprovalThreshold: number | null;
  enableTableManagement: boolean;
  orderingMode: string;
  receiptCopies: number;
  enableKitchenDisplay: boolean;
  enableLoyaltyProgram: boolean;

  // Order Naming
  orderNamePrefix: string;
  includeDateInOrderName: boolean;
  orderNumberStart: number;
  orderNumberPadding: number;
  showOrderNumberPrefix: boolean;

  // Receipt Configuration
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
  showImageOnReceipt: boolean;
  showAdditionalDetailsOnPhysicalReceipt: boolean;
  showAdditionalDetailsOnDigitalReceipt: boolean;
  showQrCodeOnReceipt: boolean;
  receiptQrCodeUrl: string | null;
  autoPrintReceipt: boolean;
  autoEmailReceipt: boolean;
  autoSmsReceipt: boolean;

  // Invoice
  invoiceNumberPrefix: string;
  includeDateInInvoiceNumber: boolean;
  companyRegistrationNumber: string | null;
  taxIdentificationNumber: string | null;
  defaultPaymentTerms: string | null;
  defaultInvoiceDueDays: number;

  // Tax
  pricesIncludeTax: boolean;
  defaultTaxRate: number;
  taxLabel: string;

  // Customer Loyalty
  customerLoyaltyAwardType: string;
  customerLoyaltyPointsPerOrder: number;
  customerLoyaltyPointsPerValue: number;
  customerLoyaltyValueThreshold: number;
  customerLoyaltyMinimumRedeemablePoints: number;

  // Staff Points
  enableStaffPoints: boolean;
  staffPointsAwardType: string;
  staffPointsPerOrder: number;
  staffPointsPerValue: number;
  staffPointsValueThreshold: number;
  staffMinimumRedeemablePoints: number;
  staffPointsRecipient: string;

  // Day Sessions
  enableDaySessions: boolean;
  autoOpenDay: boolean;
  autoCloseDay: boolean;

  // Inventory Flags
  batchTrackingEnabled: boolean;
  qualityInspectionEnabled: boolean;
  autoReorderEnabled: boolean;
  autoClosingEnabled: boolean;
  warehouseManagementEnabled: boolean;
  cycleCountingEnabled: boolean;
  consumptionRulesEnabled: boolean;
  expiryAlertDays: number;
  reservationExpiryMinutes: number;
  rfqEnabled: boolean;

  // Location Notifications
  lowStockAlertEmail: string | null;
  dailyReportEmail: string | null;
  alertPhoneNumber: string | null;
  sendDailySalesEmail: boolean;
  sendWeeklySalesEmail: boolean;

  // Settlement
  minimumSettlementAmount: number | null;
  autoCloseBusinessDays: boolean;

  // Operating Hours
  operatingHours: OperatingHour[];

  // System flags
  locationId: string | null;
  canDelete: boolean;
  status: boolean;
  isDefault: boolean;
  isActive: boolean;
  isArchived: boolean;

  // Legacy fields (keeping for backwards compat with existing forms)
  enableOrdersPrintsCount?: boolean;
  enableNotifications?: boolean;
  trackInventory?: boolean;
  receiptImageUpload?: string;
  receiptImage?: string;
  currencyCode?: string;
  systemPasscode?: string;
  reportsPasscode?: string;
  usePasscode?: boolean;
  useRecipe?: boolean;
  useDepartments?: boolean;
  useCustomPrice?: boolean;
  useWarehouse?: boolean;
  useShifts_legacy?: boolean;
  useKds?: boolean;
  ticketToHaveAmount?: boolean;
  printEachTicketItem?: boolean;
  acceptOrderRequests?: boolean;
  orderRequestAcceptStartTime?: string | null;
  orderRequestAcceptEndTime?: string | null;
  showDateOnOrderNumber?: boolean;
  orderNumberPrefix_legacy?: string;
  autoPrintReceiptAfterSale?: boolean;
  enableCustomerLoyaltyPoints?: boolean;
}

export type SettingType =
  | "switch"
  | "input"
  | "select"
  | "number"
  | "text"
  | "password"
  | "button"
  | "country-select"
  | "textarea";

export type SettingCategory =
  | "operations"
  | "pos"
  | "orders"
  | "order-naming"
  | "tax"
  | "settlement"
  | "tipping"
  | "inventory-flags"
  | "day-sessions"
  | "dockets"
  | "receipts"
  | "invoice"
  | "receipt-actions"
  | "notifications"
  | "location-notifications"
  | "stock-movement"
  | "loyalty"
  | "staff-points";

export interface SettingField {
  key: string;
  label: string;
  type: SettingType;
  category: SettingCategory;
  placeholder?: string;
  helperText?: string;
  inputType?: "text" | "number" | "password" | "tel" | "email";
  disabled?: boolean;
  dependencies?: string[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: { value: string; label: string }[];
}

// Complete settings configuration organized by the new API categories
export const SETTINGS_CONFIG: SettingField[] = [
  // --- Operations ---
  {
    key: "currency",
    label: "Currency",
    type: "text",
    category: "operations",
    placeholder: "TZS",
    helperText: "3-letter ISO 4217 currency code for this location",
  },
  {
    key: "orderingMode",
    label: "Ordering Mode",
    type: "select",
    category: "operations",
    helperText: "How orders are organized at this location",
    options: [
      { value: "STANDARD", label: "Standard (standalone orders)" },
      { value: "TABLE_MANAGEMENT", label: "Table Management (table-based orders)" },
    ],
  },
  {
    key: "enableTableManagement",
    label: "Table Management",
    type: "switch",
    category: "operations",
    helperText: "Enable physical table management",
  },
  {
    key: "useShifts",
    label: "Shifts",
    type: "switch",
    category: "operations",
    helperText: "Enable shift management for staff",
  },
  {
    key: "usePasscodes",
    label: "Passcodes",
    type: "switch",
    category: "operations",
    helperText: "Require passcodes for system access",
  },
  {
    key: "enableKitchenDisplay",
    label: "Kitchen Display (KDS)",
    type: "switch",
    category: "operations",
    helperText: "Enable Kitchen Display System",
  },
  {
    key: "receiptCopies",
    label: "Receipt Copies",
    type: "number",
    category: "operations",
    placeholder: "1",
    helperText: "Number of receipt copies to print (1-10)",
    inputType: "number",
    min: 1,
    max: 10,
  },
  {
    key: "minimumOrderAmount",
    label: "Minimum Order Amount",
    type: "number",
    category: "operations",
    placeholder: "0",
    helperText: "Minimum order value to accept",
    inputType: "number",
    min: 0,
    step: 0.01,
  },
  {
    key: "maxDiscountPercentage",
    label: "Max Discount (%)",
    type: "number",
    category: "operations",
    placeholder: "100",
    helperText: "Maximum discount percentage allowed",
    inputType: "number",
    min: 0,
    max: 100,
  },
  {
    key: "discountApprovalThreshold",
    label: "Discount Approval Threshold (%)",
    type: "number",
    category: "operations",
    placeholder: "20",
    helperText: "Discounts above this % require manager approval",
    inputType: "number",
    min: 0,
    max: 100,
  },
  {
    key: "autoCloseOrderMinutes",
    label: "Auto Close Order (minutes)",
    type: "number",
    category: "operations",
    placeholder: "Leave empty to disable",
    helperText: "Automatically close orders after this many minutes",
    inputType: "number",
    min: 1,
  },
  {
    key: "autoCloseOrderWhenFullyPaid",
    label: "Auto Close When Fully Paid",
    type: "switch",
    category: "operations",
    helperText: "Close orders automatically upon full payment",
  },
  {
    key: "autoOpenCashDrawer",
    label: "Auto Open Cash Drawer",
    type: "switch",
    category: "operations",
    helperText: "Automatically open cash drawer after a sale",
  },

  // --- POS Display ---
  {
    key: "showPosProductPrice",
    label: "Show Product Price",
    type: "switch",
    category: "pos",
    helperText: "Display product price on POS interface",
  },
  {
    key: "showPosProductQuantity",
    label: "Show Product Quantity",
    type: "switch",
    category: "pos",
    helperText: "Display product quantity on POS interface",
  },
  {
    key: "allowCustomPrice",
    label: "Allow Custom Price",
    type: "switch",
    category: "pos",
    helperText: "Allow staff to enter custom prices at POS",
  },

  // --- Order Management ---
  {
    key: "allowOrderRequests",
    label: "Allow Order Requests",
    type: "switch",
    category: "orders",
    helperText: "Enable accepting order requests from customers",
  },
  {
    key: "orderPrintsCountEnabled",
    label: "Order Prints Count",
    type: "switch",
    category: "orders",
    helperText: "Track number of times orders are printed",
  },

  // --- Tipping ---
  {
    key: "allowTipping",
    label: "Allow Tipping",
    type: "switch",
    category: "tipping",
    helperText: "Allow customers to add tips to orders",
  },

  // --- Order Naming ---
  {
    key: "orderNamePrefix",
    label: "Order Name Prefix",
    type: "text",
    category: "order-naming",
    placeholder: "Order",
    helperText: "Prefix added to order names (e.g. 'Order', 'Sale')",
    inputType: "text",
  },
  {
    key: "showOrderNumberPrefix",
    label: "Show Order Number Prefix",
    type: "switch",
    category: "order-naming",
    helperText: "Display the prefix on order numbers",
  },
  {
    key: "includeDateInOrderName",
    label: "Include Date in Order Name",
    type: "switch",
    category: "order-naming",
    helperText: "Include the date in order names (e.g. Order 20250615-0001)",
  },
  {
    key: "orderNumberStart",
    label: "Order Number Start",
    type: "number",
    category: "order-naming",
    placeholder: "1",
    helperText: "Starting number for orders",
    inputType: "number",
    min: 1,
  },
  {
    key: "orderNumberPadding",
    label: "Order Number Padding",
    type: "number",
    category: "order-naming",
    placeholder: "4",
    helperText: "Zero-padding for order numbers (e.g. 4 → 0001)",
    inputType: "number",
    min: 1,
    max: 10,
  },

  // --- Tax ---
  {
    key: "pricesIncludeTax",
    label: "Prices Include Tax",
    type: "switch",
    category: "tax",
    helperText: "Whether displayed prices include tax",
  },
  {
    key: "defaultTaxRate",
    label: "Tax Rate (%)",
    type: "number",
    category: "tax",
    placeholder: "18.0",
    helperText: "Default tax rate for this location",
    inputType: "number",
    min: 0,
    max: 100,
    step: 0.01,
  },
  {
    key: "taxLabel",
    label: "Tax Label",
    type: "text",
    category: "tax",
    placeholder: "VAT",
    helperText: "Label shown for tax on receipts (e.g. VAT, GST)",
    inputType: "text",
  },

  // --- Settlement ---
  {
    key: "minimumSettlementAmount",
    label: "Minimum Settlement Amount",
    type: "number",
    category: "settlement",
    placeholder: "0",
    helperText: "Minimum amount required for settlement",
    inputType: "number",
    min: 0,
    step: 0.01,
  },
  {
    key: "autoCloseBusinessDays",
    label: "Auto Close Business Days",
    type: "switch",
    category: "settlement",
    helperText: "Automatically close business day at end of operations",
  },

  // --- Day Sessions ---
  {
    key: "enableDaySessions",
    label: "Enable Day Sessions",
    type: "switch",
    category: "day-sessions",
    helperText: "Enable daily open/close business cycles",
  },
  {
    key: "autoOpenDay",
    label: "Auto Open Day",
    type: "switch",
    category: "day-sessions",
    helperText: "Automatically open day session at scheduled time",
    dependencies: ["enableDaySessions"],
  },
  {
    key: "autoCloseDay",
    label: "Auto Close Day",
    type: "switch",
    category: "day-sessions",
    helperText: "Automatically close day session at end of business hours",
    dependencies: ["enableDaySessions"],
  },

  // --- Inventory Flags ---
  {
    key: "batchTrackingEnabled",
    label: "Batch Tracking",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable batch number tracking for inventory",
  },
  {
    key: "qualityInspectionEnabled",
    label: "Quality Inspection",
    type: "switch",
    category: "inventory-flags",
    helperText: "Require quality inspection for received goods",
  },
  {
    key: "autoReorderEnabled",
    label: "Auto Reorder",
    type: "switch",
    category: "inventory-flags",
    helperText: "Automatically create reorder when stock is low",
  },
  {
    key: "autoClosingEnabled",
    label: "Auto Closing",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable automatic inventory closing",
  },
  {
    key: "warehouseManagementEnabled",
    label: "Warehouse Management",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable warehouse management features",
  },
  {
    key: "cycleCountingEnabled",
    label: "Cycle Counting",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable periodic cycle counts for inventory accuracy",
  },
  {
    key: "consumptionRulesEnabled",
    label: "Consumption Rules",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable automatic consumption/deduction rules",
  },
  {
    key: "rfqEnabled",
    label: "Request for Quotation (RFQ)",
    type: "switch",
    category: "inventory-flags",
    helperText: "Enable request for quotation workflow",
  },
  {
    key: "expiryAlertDays",
    label: "Expiry Alert (days)",
    type: "number",
    category: "inventory-flags",
    placeholder: "7",
    helperText: "Days before expiry to trigger alerts",
    inputType: "number",
    min: 1,
    max: 365,
  },
  {
    key: "reservationExpiryMinutes",
    label: "Stock Reservation Expiry (minutes)",
    type: "number",
    category: "inventory-flags",
    placeholder: "30",
    helperText: "Minutes before reserved stock is released",
    inputType: "number",
    min: 1,
    max: 1440,
  },

  // --- Stock Movement ---
  {
    key: "deductStockOnItemChange",
    label: "Deduct on Item Change",
    type: "switch",
    category: "stock-movement",
    helperText: "Deduct stock when items are modified in an order",
  },
  {
    key: "deductStockOnOrderClose",
    label: "Deduct on Order Close",
    type: "switch",
    category: "stock-movement",
    helperText: "Deduct stock when an order is closed",
  },
  {
    key: "deductStockOnPartialPay",
    label: "Deduct on Partial Payment",
    type: "switch",
    category: "stock-movement",
    helperText: "Deduct stock when a partial payment is made",
  },

  // --- Dockets/Tickets ---
  {
    key: "showAmountOnDockets",
    label: "Show Amount on Dockets",
    type: "switch",
    category: "dockets",
    helperText: "Include amounts on printed dockets",
  },
  {
    key: "printEachDocketItem",
    label: "Print Each Item Separately",
    type: "switch",
    category: "dockets",
    helperText: "Print each item on a separate docket",
  },
  {
    key: "showDocketCount",
    label: "Show Docket Count",
    type: "switch",
    category: "dockets",
    helperText: "Display count on dockets",
  },
  {
    key: "singleTicketPrint",
    label: "Single Ticket Print",
    type: "switch",
    category: "dockets",
    helperText: "Print a single ticket for the entire order",
  },
  {
    key: "showPriceOnTicket",
    label: "Show Price on Ticket",
    type: "switch",
    category: "dockets",
    helperText: "Display prices on printed tickets",
  },
  {
    key: "autoPrintTickets",
    label: "Auto Print Tickets",
    type: "switch",
    category: "dockets",
    helperText: "Automatically print tickets when orders are placed",
  },
  {
    key: "allowDuplicateDocketPrinting",
    label: "Allow Duplicate Docket Printing",
    type: "switch",
    category: "dockets",
    helperText: "Allow reprinting dockets for the same order",
  },

  // --- Receipt Configuration ---
  {
    key: "receiptBusinessName",
    label: "Business Name on Receipt",
    type: "text",
    category: "receipts",
    placeholder: "My Business Ltd",
    helperText: "Business name displayed on receipts",
    inputType: "text",
  },
  {
    key: "receiptHeaderText",
    label: "Receipt Header Text",
    type: "textarea",
    category: "receipts",
    placeholder: "123 Main St, Dar es Salaam",
    helperText: "Text shown in receipt header (address, etc.)",
  },
  {
    key: "receiptFooterText",
    label: "Receipt Footer Text",
    type: "textarea",
    category: "receipts",
    placeholder: "Thank you for your business!",
    helperText: "Text shown at the bottom of receipts",
  },
  {
    key: "receiptNumberPrefix",
    label: "Receipt Number Prefix",
    type: "text",
    category: "receipts",
    placeholder: "RCP",
    helperText: "Prefix for receipt numbers",
    inputType: "text",
  },
  {
    key: "receiptNumberSuffix",
    label: "Receipt Number Suffix",
    type: "text",
    category: "receipts",
    placeholder: "-TZ",
    helperText: "Suffix for receipt numbers",
    inputType: "text",
  },
  {
    key: "receiptHeaderImageUrl",
    label: "Receipt Header Image URL",
    type: "text",
    category: "receipts",
    placeholder: "https://...",
    helperText: "Image URL displayed at the top of receipts",
    inputType: "text",
  },
  {
    key: "receiptQrCodeUrl",
    label: "Receipt QR Code URL",
    type: "text",
    category: "receipts",
    placeholder: "https://...",
    helperText: "URL encoded in receipt QR code",
    inputType: "text",
    dependencies: ["showQrCodeOnReceipt"],
  },
  {
    key: "physicalReceiptPaymentDetails",
    label: "Physical Receipt Payment Details",
    type: "textarea",
    category: "receipts",
    placeholder: "Bank: NMB\nAccount: 123456",
    helperText: "Payment details shown on physical receipts",
  },
  {
    key: "digitalReceiptPaymentDetails",
    label: "Digital Receipt Payment Details",
    type: "textarea",
    category: "receipts",
    placeholder: "Pay online: https://...",
    helperText: "Payment details shown on digital receipts",
  },

  // --- Receipt Display Toggles ---
  {
    key: "showImageOnReceipt",
    label: "Show Image on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display header image on receipts",
  },
  {
    key: "showQrCodeOnReceipt",
    label: "Show QR Code on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display QR code on receipts",
  },
  {
    key: "includePaymentDetailsOnReceipt",
    label: "Include Payment Details",
    type: "switch",
    category: "receipt-actions",
    helperText: "Show payment method details on receipts",
  },
  {
    key: "showItemizedReceipt",
    label: "Show Itemized Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Show individual items on receipts",
  },
  {
    key: "showTaxOnReceipt",
    label: "Show Tax on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display tax breakdown on receipts",
  },
  {
    key: "showDiscountOnReceipt",
    label: "Show Discount on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display discount details on receipts",
  },
  {
    key: "showStaffOnReceipt",
    label: "Show Staff on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display staff name on receipts",
  },
  {
    key: "showCustomerOnReceipt",
    label: "Show Customer on Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Display customer name on receipts",
  },
  {
    key: "showAdditionalDetailsOnPhysicalReceipt",
    label: "Additional Details on Physical Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Show extra payment details on physical receipts",
  },
  {
    key: "showAdditionalDetailsOnDigitalReceipt",
    label: "Additional Details on Digital Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Show extra payment details on digital receipts",
  },
  {
    key: "autoPrintReceipt",
    label: "Auto Print Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Automatically print receipt after completing a sale",
  },
  {
    key: "autoEmailReceipt",
    label: "Auto Email Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Automatically email receipt to customer",
  },
  {
    key: "autoSmsReceipt",
    label: "Auto SMS Receipt",
    type: "switch",
    category: "receipt-actions",
    helperText: "Automatically send receipt via SMS",
  },

  // --- Invoice ---
  {
    key: "invoiceNumberPrefix",
    label: "Invoice Number Prefix",
    type: "text",
    category: "invoice",
    placeholder: "INV",
    helperText: "Prefix for invoice numbers",
    inputType: "text",
  },
  {
    key: "includeDateInInvoiceNumber",
    label: "Include Date in Invoice Number",
    type: "switch",
    category: "invoice",
    helperText: "Include date in invoice numbering",
  },
  {
    key: "companyRegistrationNumber",
    label: "Company Registration Number",
    type: "text",
    category: "invoice",
    placeholder: "Registration number",
    helperText: "Company registration number shown on invoices",
    inputType: "text",
  },
  {
    key: "taxIdentificationNumber",
    label: "Tax ID Number",
    type: "text",
    category: "invoice",
    placeholder: "TIN",
    helperText: "Tax identification number shown on invoices",
    inputType: "text",
  },
  {
    key: "defaultPaymentTerms",
    label: "Default Payment Terms",
    type: "text",
    category: "invoice",
    placeholder: "Net 30",
    helperText: "Default payment terms on invoices",
    inputType: "text",
  },
  {
    key: "defaultInvoiceDueDays",
    label: "Invoice Due Days",
    type: "number",
    category: "invoice",
    placeholder: "30",
    helperText: "Number of days until invoice is due",
    inputType: "number",
    min: 0,
  },

  // --- Notifications ---
  {
    key: "enableEmailNotifications",
    label: "Email Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive notifications via email",
  },
  {
    key: "enableSmsNotifications",
    label: "SMS Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive notifications via SMS",
  },
  {
    key: "enablePushNotifications",
    label: "Push Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive push notifications on devices",
  },

  // --- Location Notifications ---
  {
    key: "lowStockAlertEmail",
    label: "Low Stock Alert Email",
    type: "text",
    category: "location-notifications",
    placeholder: "alerts@business.com",
    helperText: "Email address for low stock alerts",
    inputType: "email",
  },
  {
    key: "dailyReportEmail",
    label: "Daily Report Email",
    type: "text",
    category: "location-notifications",
    placeholder: "reports@business.com",
    helperText: "Email address for daily sales reports",
    inputType: "email",
  },
  {
    key: "alertPhoneNumber",
    label: "Alert Phone Number",
    type: "text",
    category: "location-notifications",
    placeholder: "+255712345678",
    helperText: "Phone number for urgent alerts",
    inputType: "tel",
  },
  {
    key: "sendDailySalesEmail",
    label: "Send Daily Sales Email",
    type: "switch",
    category: "location-notifications",
    helperText: "Send daily sales summary email",
  },
  {
    key: "sendWeeklySalesEmail",
    label: "Send Weekly Sales Email",
    type: "switch",
    category: "location-notifications",
    helperText: "Send weekly sales summary email",
  },

  // --- Customer Loyalty Points ---
  {
    key: "customerLoyaltyAwardType",
    label: "Award Type",
    type: "select",
    category: "loyalty",
    helperText: "How customers earn loyalty points",
    options: [
      { value: "PER_ORDER", label: "Per Order (flat points per order)" },
      { value: "PER_ORDER_VALUE", label: "Per Order Value (based on amount)" },
    ],
  },
  {
    key: "customerLoyaltyPointsPerOrder",
    label: "Points Per Order",
    type: "number",
    category: "loyalty",
    placeholder: "1",
    helperText: "Flat points awarded per closed order",
    inputType: "number",
    min: 1,
    max: 10000,
  },
  {
    key: "customerLoyaltyPointsPerValue",
    label: "Points Per Value Threshold",
    type: "number",
    category: "loyalty",
    placeholder: "1",
    helperText: "Points earned each time value threshold is reached",
    inputType: "number",
    min: 1,
    max: 10000,
  },
  {
    key: "customerLoyaltyValueThreshold",
    label: "Value Threshold",
    type: "number",
    category: "loyalty",
    placeholder: "1000",
    helperText: "Order amount needed to earn points",
    inputType: "number",
    min: 1,
    step: 0.01,
  },
  {
    key: "customerLoyaltyMinimumRedeemablePoints",
    label: "Minimum Redeemable Points",
    type: "number",
    category: "loyalty",
    placeholder: "100",
    helperText: "Minimum points before customers can redeem",
    inputType: "number",
    min: 0,
  },

  // --- Staff Points ---
  {
    key: "enableStaffPoints",
    label: "Enable Staff Points",
    type: "switch",
    category: "staff-points",
    helperText: "Enable points program for staff members",
  },
  {
    key: "staffPointsAwardType",
    label: "Award Type",
    type: "select",
    category: "staff-points",
    helperText: "How staff members earn points",
    dependencies: ["enableStaffPoints"],
    options: [
      { value: "PER_ORDER", label: "Per Order (flat points per order)" },
      { value: "PER_ORDER_VALUE", label: "Per Order Value (based on amount)" },
    ],
  },
  {
    key: "staffPointsPerOrder",
    label: "Points Per Order",
    type: "number",
    category: "staff-points",
    placeholder: "1",
    helperText: "Flat points awarded per closed order",
    inputType: "number",
    min: 1,
    max: 10000,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffPointsPerValue",
    label: "Points Per Value Threshold",
    type: "number",
    category: "staff-points",
    placeholder: "1",
    helperText: "Points earned each time value threshold is reached",
    inputType: "number",
    min: 1,
    max: 10000,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffPointsValueThreshold",
    label: "Value Threshold",
    type: "number",
    category: "staff-points",
    placeholder: "1000",
    helperText: "Order amount needed to earn points",
    inputType: "number",
    min: 1,
    step: 0.01,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffMinimumRedeemablePoints",
    label: "Minimum Redeemable Points",
    type: "number",
    category: "staff-points",
    placeholder: "100",
    helperText: "Minimum points staff must accumulate before redeeming",
    inputType: "number",
    min: 0,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffPointsRecipient",
    label: "Points Recipient",
    type: "select",
    category: "staff-points",
    helperText: "Which staff member receives the points for an order",
    dependencies: ["enableStaffPoints"],
    options: [
      { value: "FINISHED_BY", label: "Finished By (staff who closed the order)" },
      { value: "ASSIGNED_TO", label: "Assigned To (staff assigned to the order)" },
      { value: "SPLIT", label: "Split (divide between both)" },
    ],
  },
];

// Category display names
export const CATEGORY_TITLES: Record<string, string> = {
  operations: "Operations",
  pos: "POS Display",
  orders: "Order Management",
  "order-naming": "Order Naming",
  tax: "Tax",
  settlement: "Settlement",
  tipping: "Tipping",
  "inventory-flags": "Inventory Management",
  "day-sessions": "Day Sessions",
  dockets: "Dockets & Tickets",
  receipts: "Receipt Content",
  "receipt-actions": "Receipt Options",
  invoice: "Invoice",
  notifications: "Notifications",
  "location-notifications": "Alert Contacts & Reports",
  "stock-movement": "Stock Movement",
  loyalty: "Customer Loyalty Points",
  "staff-points": "Staff Points",
};
