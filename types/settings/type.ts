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
  locationId: string | null;
  canDelete: boolean;
  status: boolean;
  isDefault: boolean;
  isActive: boolean;
  isArchived: boolean;
  trackInventory?: boolean;
  enableNotifications?: boolean;
  autoCloseOrderWhenFullyPaid?: boolean;
  showQrCodeOnReceipt: boolean;
  showImageOnReceipt: boolean;
  showAdditionalDetailsOnPhysicalReceipt: boolean;
  showAdditionalDetailsOnDigitalReceipt: boolean;

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
  | "password";

export interface SettingField {
  key: keyof LocationSettings;
  label: string;
  type: SettingType;
  category:
    | "basic"
    | "feature"
    | "system"
    | "printing"
    | "inventory"
    | "notifications"
    | "order"
    | "receipt";
  placeholder?: string;
  helperText?: string;
  inputType?: "text" | "number" | "password" | "tel" | "email";
  disabled?: boolean;
  dependencies?: string[]; // for conditional enabling/disabling
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

// Complete settings configuration
export const SETTINGS_CONFIG: SettingField[] = [
  // Basic Settings
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
    category: "feature",
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
    category: "feature",
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

  // Receipt Settings
  {
    key: "showQrCodeOnReceipt",
    label: "Show QrCode On Receipt",
    type: "switch",
    category: "receipt",
    helperText: "Show QR Code on printed receipt",
  },

  {
    key: "showImageOnReceipt",
    label: "Show Image On Receipt",
    type: "switch",
    category: "receipt",
    helperText: "Show image on printed receipt (opens upload dialog)",
  },
  {
    key: "showAdditionalDetailsOnPhysicalReceipt",
    label: "Show Additional Details On Physical Receipt",
    type: "switch",
    category: "receipt",
    helperText: "Show payment details (bank/MNO) on physical receipt",
  },
  {
    key: "showAdditionalDetailsOnDigitalReceipt",
    label: "Show Additional Details On Digital Receipt",
    type: "switch",
    category: "receipt",
    helperText: "Show payment details (bank/MNO) on digital receipt",
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

  // Notifications Settings
  {
    key: "enableNotifications",
    label: "Enable Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Enable all notification types",
  },
  {
    key: "enableEmailNotifications",
    label: "Enable Email Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive notifications via email",
  },
  {
    key: "enableSmsNotifications",
    label: "Enable SMS Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive notifications via SMS",
  },
  {
    key: "enablePushNotifications",
    label: "Enable Push Notifications",
    type: "switch",
    category: "notifications",
    helperText: "Receive push notifications",
  },

  // System Settings
  {
    key: "isDefault",
    label: "Set as Main Location",
    type: "switch",
    category: "system",
    helperText: "Set this location as the main/default location",
  },
  {
    key: "isActive",
    label: "Is Active",
    type: "switch",
    category: "system",
    helperText: "Activate/deactivate this location",
  },
];
