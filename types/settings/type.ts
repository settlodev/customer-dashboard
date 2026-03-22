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

export interface LocationSettings {
  id: UUID;
  minimumSettlementAmount: number;
  systemPasscode: string;
  currencyCode: string;
  reportsPasscode: string;
  ecommerceEnabled: boolean;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  enableOrdersPrintsCount: boolean;
  useRecipe: boolean;
  usePasscode: boolean;
  useDepartments: boolean;
  useCustomPrice: boolean;
  useWarehouse: boolean;
  useShifts: boolean;
  showPosProductQuantity: boolean;
  showPosProductPrice: boolean;
  printEachTicketItem: boolean;
  ticketToHaveAmount: boolean;
  singleTicketPrint: boolean;
  showPriceOnTicket: boolean;
  allowTipping: boolean;
  deductStockOnItemChange: boolean;
  deductStockOnOrderClose: boolean;
  deductStockOnPartialPay: boolean;
  useKds: boolean;
  showDateOnOrderNumber: boolean;
  showOrderNumberPrefix: boolean;
  orderNumberPrefix: string;
  acceptOrderRequests: boolean;
  orderRequestAcceptStartTime: string | null;
  orderRequestAcceptEndTime: string | null;
  locationId: string | null;
  canDelete: boolean;
  status: boolean;
  isDefault: boolean;
  isActive: boolean;
  isArchived: boolean;
  trackInventory?: boolean;
  enableNotifications?: boolean;
  autoCloseOrderWhenFullyPaid?: boolean;
  autoPrintTickets: boolean;
  autoOpenCashDrawer: boolean;
  autoPrintReceiptAfterSale: boolean;
  receiptImageUpload: string;
  showQrCodeOnReceipt: boolean;
  showImageOnReceipt: boolean;
  showAdditionalDetailsOnPhysicalReceipt: boolean;
  showAdditionalDetailsOnDigitalReceipt: boolean;

  // Customer Loyalty Points
  enableCustomerLoyaltyPoints: boolean;
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

  // New fields for extended functionality
  receiptImage?: string;
  physicalReceiptPaymentDetails?: PaymentDetails;
  digitalReceiptPaymentDetails?: PaymentDetails;
}

export type SettingType =
  | "switch"
  | "input"
  | "select"
  | "number"
  | "text"
  | "password"
  | "button"
  | "country-select";

export interface SettingField {
  key: keyof LocationSettings;
  label: string;
  type: SettingType;
  category:
    | "basic"
    | "receipt"
    | "feature"
    | "system"
    | "printing"
    | "inventory"
    | "order"
    | "loyalty"
    | "staff-points";
  placeholder?: string;
  helperText?: string;
  inputType?: "text" | "number" | "password" | "tel" | "email";
  disabled?: boolean;
  dependencies?: string[]; // for conditional enabling/disabling
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: { value: string; label: string }[];
}

// Complete settings configuration
export const SETTINGS_CONFIG: SettingField[] = [
  // Basic Settings
  {
    key: "currencyCode",
    label: "Currency",
    type: "country-select",
    category: "basic",
    placeholder: "Select country",
    helperText: "Country and currency for this location",
  },
  {
    key: "minimumSettlementAmount",
    label: "Minimum Settlement Amount",
    type: "number",
    category: "basic",
    placeholder: "Enter minimum settlement amount",
    inputType: "number",
    min: 0,
    step: 0.01,
  },
  {
    key: "systemPasscode",
    label: "System Passcode",
    type: "password",
    category: "basic",
    placeholder: "Enter system passcode",
    inputType: "password",
  },
  {
    key: "reportsPasscode",
    label: "Report Passcode",
    type: "password",
    category: "basic",
    placeholder: "Enter report passcode",
    inputType: "password",
  },

  // Receipt Management (Buttons for uploading and configuring)
  {
    key: "receiptImageUpload" as any,
    label: "Receipt Image",
    type: "button" as any,
    category: "receipt" as any,
    helperText: "Upload or change the image to display on receipts",
  },

  {
    key: "physicalReceiptPaymentDetails" as any,
    label: "Physical Receipt Payment Details",
    type: "button" as any,
    category: "receipt" as any,
    helperText:
      "Add or edit bank and MNO payment details for physical receipts",
  },

  {
    key: "digitalReceiptPaymentDetails" as any,
    label: "Digital Receipt Payment Details",
    type: "button" as any,
    category: "receipt" as any,
    helperText: "Add or edit bank and MNO payment details for digital receipts",
  },

  // Feature Settings
  {
    key: "trackInventory",
    label: "Track Inventory",
    type: "switch",
    category: "feature",
    helperText: "Enable inventory tracking for this location",
  },
  {
    key: "ecommerceEnabled",
    label: "Enable Ecommerce",
    type: "switch",
    category: "feature",
    helperText: "Enable ecommerce functionality",
  },
  {
    key: "useRecipe",
    label: "Use Recipe",
    type: "switch",
    category: "feature",
    helperText: "Enable recipe management",
  },
  {
    key: "usePasscode",
    label: "Use Passcode",
    type: "switch",
    category: "basic",
    helperText: "Require passcode for system access",
  },
  {
    key: "useDepartments",
    label: "Use Departments",
    type: "switch",
    category: "feature",
    helperText: "Enable department management",
  },
  {
    key: "useCustomPrice",
    label: "Use Custom Price",
    type: "switch",
    category: "feature",
    helperText: "Allow custom pricing per item",
  },
  {
    key: "useWarehouse",
    label: "Use Warehouse",
    type: "switch",
    category: "feature",
    helperText: "Enable warehouse management",
  },
  {
    key: "useShifts",
    label: "Use Shifts",
    type: "switch",
    category: "feature",
    helperText: "Enable shift management for staff",
  },
  {
    key: "useKds",
    label: "Use KDS",
    type: "switch",
    category: "feature",
    helperText: "Enable Kitchen Display System",
  },
  {
    key: "enableOrdersPrintsCount",
    label: "Enable Orders Prints Count",
    type: "switch",
    category: "order",
    helperText: "Track number of times orders are printed",
  },
  {
    key: "showPosProductQuantity",
    label: "Show Product Quantity on POS",
    type: "switch",
    category: "feature",
    helperText: "Display product quantity on POS interface",
  },
  {
    key: "showPosProductPrice",
    label: "Show Product Price on POS",
    type: "switch",
    category: "feature",
    helperText: "Display product price on POS interface",
  },

  // Order settings
  {
    key: "acceptOrderRequests",
    label: "Accept Order Requests",
    type: "switch",
    category: "order",
    helperText: "Enable or disable accepting order requests",
  },
  {
    key: "orderRequestAcceptStartTime",
    label: "Order Accept Start Time",
    type: "text",
    category: "order",
    placeholder: "e.g. 08:00",
    helperText: "Start time for accepting order requests (HH:mm)",
    inputType: "text",
    dependencies: ["acceptOrderRequests"],
  },
  {
    key: "orderRequestAcceptEndTime",
    label: "Order Accept End Time",
    type: "text",
    category: "order",
    placeholder: "e.g. 22:00",
    helperText: "End time for accepting order requests (HH:mm)",
    inputType: "text",
    dependencies: ["acceptOrderRequests"],
  },
  {
    key: "showOrderNumberPrefix",
    label: "Show Order Number Prefix",
    type: "switch",
    category: "order",
    helperText: "Display the prefix on order numbers",
  },
  {
    key: "orderNumberPrefix",
    label: "Order Number Prefix",
    type: "text",
    category: "order",
    placeholder: "e.g. Order",
    helperText: "Prefix added to the beginning of each order number",
    inputType: "text",
    dependencies: ["showOrderNumberPrefix"],
  },
  {
    key: "showDateOnOrderNumber",
    label: "Show Date on Order Number",
    type: "switch",
    category: "order",
    helperText: "Include the date in the order number format",
  },
  {
    key: "autoCloseOrderWhenFullyPaid",
    label: "Auto Close Order When Fully Paid",
    type: "switch",
    category: "order",
    helperText: "Close orders automatically upon full payment completion",
  },
  {
    key: "allowTipping",
    label: "Allow Tipping",
    type: "switch",
    category: "order",
    helperText: "Allow customers to add tips",
  },

  // Printing Settings
  {
    key: "printEachTicketItem",
    label: "Print Each Ticket Item",
    type: "switch",
    category: "printing",
    helperText: "Print each item on ticket separately",
  },
  {
    key: "ticketToHaveAmount",
    label: "Ticket to Have Amount",
    type: "switch",
    category: "printing",
    helperText: "Include amount on printed tickets",
  },
  {
    key: "singleTicketPrint",
    label: "Single Ticket Print",
    type: "switch",
    category: "printing",
    helperText: "Print single ticket for entire order",
  },
  {
    key: "showPriceOnTicket",
    label: "Show Price on Ticket",
    type: "switch",
    category: "printing",
    helperText: "Display prices on printed tickets",
  },
  {
    key: "autoPrintTickets",
    label: "Auto Print Tickets",
    type: "switch",
    category: "printing",
    helperText: "Automatically print tickets when orders are placed",
  },
  {
    key: "autoOpenCashDrawer",
    label: "Auto Open Cash Drawer",
    type: "switch",
    category: "order",
    helperText: "Automatically open the cash drawer after a sale",
  },
  {
    key: "autoPrintReceiptAfterSale",
    label: "Auto Print Receipt After Sale",
    type: "switch",
    category: "printing",
    helperText: "Automatically print a receipt after completing a sale",
  },
  {
    key: "showQrCodeOnReceipt",
    label: "Show QrCode On Receipt",
    type: "switch",
    category: "printing",
    helperText: "Show QR Code on printed receipt",
  },

  {
    key: "showImageOnReceipt",
    label: "Show Image On Receipt",
    type: "switch",
    category: "printing",
    helperText: "Show image on printed receipt",
  },

  {
    key: "showAdditionalDetailsOnPhysicalReceipt",
    label: "Show Additional Details On Physical Receipt",
    type: "switch",
    category: "printing",
    helperText: "Show payment details on physical receipt",
  },

  {
    key: "showAdditionalDetailsOnDigitalReceipt",
    label: "Show Additional Details On Digital Receipt",
    type: "switch",
    category: "printing",
    helperText: "Show payment details on digital receipt",
  },

  // Inventory Settings
  {
    key: "deductStockOnItemChange",
    label: "Deduct Stock on Item Change",
    type: "switch",
    category: "inventory",
    helperText: "Deduct stock when items are modified",
  },
  {
    key: "deductStockOnOrderClose",
    label: "Deduct Stock on Order Close",
    type: "switch",
    category: "inventory",
    helperText: "Deduct stock when orders are closed",
  },
  {
    key: "deductStockOnPartialPay",
    label: "Deduct Stock on Partial Payment",
    type: "switch",
    category: "inventory",
    helperText: "Deduct stock on partial payments",
  },

  // General Settings
  {
    key: "isDefault",
    label: "Set as Main Location",
    type: "switch",
    category: "basic",
    helperText: "Set this location as the main/default location",
  },

  // Customer Loyalty Points
  {
    key: "enableCustomerLoyaltyPoints",
    label: "Enable Customer Loyalty Points",
    type: "switch",
    category: "loyalty",
    helperText: "Enable loyalty points program for customers",
  },
  {
    key: "customerLoyaltyAwardType",
    label: "Award Type",
    type: "select",
    category: "loyalty",
    helperText: "How customers earn loyalty points",
    dependencies: ["enableCustomerLoyaltyPoints"],
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
    placeholder: "e.g. 10",
    helperText: "Flat points awarded per closed order",
    inputType: "number",
    min: 0,
    step: 1,
    dependencies: ["enableCustomerLoyaltyPoints"],
  },
  {
    key: "customerLoyaltyPointsPerValue",
    label: "Points Per Value Threshold",
    type: "number",
    category: "loyalty",
    placeholder: "e.g. 1",
    helperText: "Points earned each time the value threshold is reached",
    inputType: "number",
    min: 0,
    step: 1,
    dependencies: ["enableCustomerLoyaltyPoints"],
  },
  {
    key: "customerLoyaltyValueThreshold",
    label: "Value Threshold",
    type: "number",
    category: "loyalty",
    placeholder: "e.g. 1000",
    helperText: "Order amount needed to earn points (e.g. 1000 = 1 point per 1000 spent)",
    inputType: "number",
    min: 0,
    step: 0.01,
    dependencies: ["enableCustomerLoyaltyPoints"],
  },
  {
    key: "customerLoyaltyMinimumRedeemablePoints",
    label: "Minimum Redeemable Points",
    type: "number",
    category: "loyalty",
    placeholder: "e.g. 50",
    helperText: "Minimum points a customer must accumulate before redeeming",
    inputType: "number",
    min: 0,
    step: 1,
    dependencies: ["enableCustomerLoyaltyPoints"],
  },

  // Staff Points
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
    placeholder: "e.g. 5",
    helperText: "Flat points awarded per closed order",
    inputType: "number",
    min: 0,
    step: 1,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffPointsPerValue",
    label: "Points Per Value Threshold",
    type: "number",
    category: "staff-points",
    placeholder: "e.g. 1",
    helperText: "Points earned each time the value threshold is reached",
    inputType: "number",
    min: 0,
    step: 1,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffPointsValueThreshold",
    label: "Value Threshold",
    type: "number",
    category: "staff-points",
    placeholder: "e.g. 5000",
    helperText: "Order amount needed to earn points",
    inputType: "number",
    min: 0,
    step: 0.01,
    dependencies: ["enableStaffPoints"],
  },
  {
    key: "staffMinimumRedeemablePoints",
    label: "Minimum Redeemable Points",
    type: "number",
    category: "staff-points",
    placeholder: "e.g. 100",
    helperText: "Minimum points staff must accumulate before redeeming",
    inputType: "number",
    min: 0,
    step: 1,
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
