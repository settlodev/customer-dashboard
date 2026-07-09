import { UUID } from "node:crypto";

// ─── Enums ───────────────────────────────────────────────────────────
// Mirrors settlo-common; kept as TS string-enums so server payloads
// (which arrive as plain strings) line up without runtime conversion.

export enum OrderStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
  // Terminal state for orders that were created against a table but
  // never had any items added before being cancelled. EOD purge sweeps
  // them so they don't pollute reports as a real cancellation.
  ABANDONED = "ABANDONED",
}

export enum OrderType {
  IMMEDIATE = "IMMEDIATE",
  RESERVATION = "RESERVATION",
  DINE_IN = "DINE_IN",
  TAKEAWAY = "TAKEAWAY",
  DELIVERY = "DELIVERY",
  DRIVE_THRU = "DRIVE_THRU",
}

export enum OrderSource {
  POS = "POS",
  ONLINE = "ONLINE",
  QR = "QR",
  TABLE = "TABLE",
  DELIVERY = "DELIVERY",
  KIOSK = "KIOSK",
  API = "API",
  MARKETPLACE = "MARKETPLACE",
}

export enum ServingType {
  DINE_IN = "DINE_IN",
  TAKEAWAY = "TAKEAWAY",
  DELIVERY = "DELIVERY",
  DRIVE_THRU = "DRIVE_THRU",
}

export enum PaymentStatus {
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
  PARTIAL = "PARTIAL",
}

export enum PlatformType {
  APP = "APP",
  ECOMMERCE = "ECOMMERCE",
  SELF_SERVICE = "SELF_SERVICE",
}

export enum OrderPriority {
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  RUSH = "RUSH",
  VIP = "VIP",
}

export enum FulfillmentStatus {
  DRAFT = "DRAFT",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  SERVED = "SERVED",
  COMPLETED = "COMPLETED",
  AWAITING_PICKUP = "AWAITING_PICKUP",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
}

export enum PreparationStatus {
  PENDING = "PENDING",
  RECEIVED = "RECEIVED",
  ACCEPTED = "ACCEPTED",
  COOKING = "COOKING",
  IN_PROGRESS = "IN_PROGRESS",
  PLATED = "PLATED",
  COMPLETED = "COMPLETED",
  BUMPED = "BUMPED",
  RECALLED = "RECALLED",
  SERVED = "SERVED",
}

export enum CancellationReason {
  CUSTOMER_REQUEST = "CUSTOMER_REQUEST",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  KITCHEN_ISSUE = "KITCHEN_ISSUE",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  DUPLICATE = "DUPLICATE",
  FRAUD = "FRAUD",
  STAFF_ERROR = "STAFF_ERROR",
  OTHER = "OTHER",
}

export enum VoidReason {
  CUSTOMER_REQUEST = "CUSTOMER_REQUEST",
  WRONG_ITEM = "WRONG_ITEM",
  DUPLICATE = "DUPLICATE",
  STAFF_ERROR = "STAFF_ERROR",
  QUALITY = "QUALITY",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  OTHER = "OTHER",
}

// ─── List / summary DTO ─────────────────────────────────────────────
// Mirrors `OrderResponseDto` from settlo-common — the shape returned by
// `GET /api/v1/orders`. Items/refunds/transactions are present for hot
// orders (the POS adds them when patching) but the dashboard list view
// only relies on the top-level fields below.

export interface Order {
  id: UUID;
  slug: string | null;
  orderNumber: string;
  locationId: UUID;
  businessId: UUID;
  settlementCurrency: string | null;
  businessDate: string;
  daySessionId: UUID | null;

  orderStatus: OrderStatus;
  orderType: OrderType | null;
  paymentStatus: PaymentStatus | null;
  platformType: PlatformType | null;
  orderSource: OrderSource | null;
  servingType: ServingType | null;
  fulfillmentStatus: FulfillmentStatus | null;
  priority: OrderPriority | null;

  notes: string | null;
  externalOrderId: string | null;
  externalPlatform: string | null;

  lockedBy: UUID | null;
  lockedAt: string | null;

  cancellationReasonType: CancellationReason | null;
  cancellationReason: string | null;
  cancelledBy: UUID | null;

  // Money — strings on the wire, numbers after parseStringify.
  grossAmount: number | null;
  netAmount: number | null;
  discountAmount: number | null;
  paidAmount: number | null;
  totalTipAmount: number | null;
  taxAmount: number | null;
  signedAmount: number | null;
  totalCostPrice: number | null;
  customerChargesTotal: number | null;
  businessCostsTotal: number | null;
  grossProfit: number | null;
  unpaidAmount: number | null;

  openedDate: string;
  closedDate: string | null;

  startedBy: UUID | null;
  assignedTo: UUID | null;
  finishedBy: UUID | null;
  customerId: UUID | null;
  tableId: UUID | null;
  reservationId: UUID | null;

  stockReservationStatus:
    | "PENDING"
    | "RESERVED"
    | "PARTIALLY_RESERVED"
    | "FAILED"
    | "EXPIRED"
    | "NOT_APPLICABLE"
    | null;

  ticketsCount: number | null;
  billCount: number | null;
  receiptCount: number | null;
  printsCount: number | null;
  docketNumber: number | null;

  items?: OrderItem[];
  removedItems?: OrderItem[];
  refunds?: OrderItemRefund[];
  costs?: OrderCost[];

  createdAt: string;
  updatedAt: string;
  offlineReplay: boolean | null;
  offlineCreatedAt: string | null;
  version: number | null;
}

export interface OrderItem {
  id: UUID;
  productVariantId: UUID | null;
  productId: UUID | null;
  name: string;
  quantity: number;
  unitPrice: number | null;
  nativeCurrency: string | null;
  nativeUnitPrice: number | null;
  nativeLineTotal: number | null;
  settlementUnitPrice: number | null;
  settlementLineTotal: number | null;
  conversionRate: number | null;
  rateCapturedAt: string | null;
  costPrice: number | null;
  discountAmount: number | null;
  netAmount: number | null;
  preparationStatus: PreparationStatus | null;
  staffId: UUID | null;
  stockTracked: boolean | null;
  printedDocketQuantity: number | null;
  lastDocketDeltaQuantity: number | null;
  modifiers: OrderItemModifier[] | null;
  addons: OrderItemAddon[] | null;
  consumptionMultiplier: number | null;
  specialInstructions: string | null;
  stationId: UUID | null;
  stationName: string | null;
  prepStartedAt: string | null;
  prepCompletedAt: string | null;
  voidReason: VoidReason | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderItemModifier {
  modifierOptionId: UUID;
  modifierGroupId: UUID;
  name: string;
  quantity: number;
  priceAdjustment: number;
}

export interface OrderItemAddon {
  productVariantId: UUID;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderItemRefund {
  id: UUID;
  orderItemId: UUID;
  quantity: number;
  returnToStock: boolean;
  reason: string | null;
  processedBy: UUID | null;
  approvedBy: UUID | null;
  refundedAt: string | null;
  refundAmount: number;
  refundCurrency: string | null;
  refundAmountSettlementEquivalent: number | null;
  rateUsed: number | null;
  originalPaymentRate: number | null;
  paymentMethodId: UUID | null;
  paymentMethodCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderCost {
  id: UUID;
  costType: string;
  description: string | null;
  amount: number;
  taxAmount: number | null;
  totalAmount: number;
  currencyCode: string | null;
  vendorName: string | null;
  vendorId: UUID | null;
  reference: string | null;
  costBearing: "CUSTOMER" | "BUSINESS" | string | null;
  expenseCategoryHint: string | null;
  attachmentUrl: string | null;
  addedBy: UUID | null;
  createdAt: string | null;
}

// ─── Detail response (`GET /orders/{id}/detail`) ────────────────────
// `OrderDetailResponse` from the OMS, used by the order details page.

export interface OrderDetailStaff {
  id: UUID | null;
  name: string | null;
}

export interface OrderDetailCustomer {
  id: UUID | null;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface OrderDetailItem {
  id: UUID;
  productId: UUID | null;
  productVariantId: UUID | null;
  name: string;
  quantity: number;
  unitPrice: number | null;
  costPrice: number | null;
  discountAmount: number | null;
  netAmount: number | null;
  taxTypeId: string | null;
  taxTypeCode: string | null;
  taxTypeName: string | null;
  taxRate: number | null;
  taxInclusive: boolean | null;
  taxableAmount: number | null;
  taxAmount: number | null;
  preparationStatus: string | null;
  specialInstructions: string | null;
  staffId: UUID | null;
  staffName: string | null;
  createdAt: string | null;
}

export interface OrderDetailTransaction {
  id: UUID;
  paymentMethodName: string | null;
  amount: number;
  tipAmount: number | null;
  status: string | null;
  createdAt: string | null;
}

export interface OrderDetailRefund {
  id: UUID;
  orderItemId: UUID | null;
  quantity: number | null;
  refundAmount: number | null;
  reason: string | null;
  createdAt: string | null;
}

export interface OrderDetailTimelineEvent {
  event: string;
  message: string | null;
  performedBy: UUID | null;
  performedByName: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

// ─── Share / receipt / VFD response types ───────────────────────────
//
// New endpoints:
//   POST   /api/v1/orders/{id}/share              → OrderShareResponse
//   DELETE /api/v1/orders/{id}/share              → OrderShareResponse (cleared)
//   GET    /api/v1/public/invoices/{token}        → PublicInvoice (no auth)
//   POST   /api/v1/orders/{id}/receipts/receipt   → ReceiptDto (snapshot)
//   GET    /api/v1/orders/{id}/receipts           → ReceiptDto[]
//   GET    /api/v1/public/receipts/{slug}         → ReceiptDto (no auth)
//   POST   /api/v1/orders/{id}/prints/vfd         → VfdPrintResponse (stub)

export interface OrderShareResponse {
  orderId: UUID;
  orderNumber: string;
  shareToken: string | null;
  shareTokenIssuedAt: string | null;
}

export interface PublicInvoiceLineItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  discountAmount: number | null;
  specialInstructions: string | null;
  modifiers: string[];
  addons: string[];
}

export interface PublicInvoice {
  businessName: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;

  orderNumber: string;
  orderStatus: string | null;
  paymentStatus: string | null;
  openedAt: string;
  shareTokenIssuedAt: string | null;
  viewedAt: string;

  customerName: string | null;

  items: PublicInvoiceLineItem[];

  subtotal: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  amountPaid: number | null;
  amountDue: number | null;

  currency: string;
}

export interface ReceiptDtoLineItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  discountAmount: number | null;
  specialInstructions: string | null;
  modifiers: string[];
  addons: string[];
}

export interface ReceiptDtoPayment {
  paymentMethod: string | null;
  amount: number | null;
  tipAmount: number | null;
  currency: string | null;
  paidAt: string | null;
  status: string | null;
}

export interface ReceiptDto {
  receiptType: "BILL" | "RECEIPT" | string;
  snapshotSlug: string;
  snapshotCreatedAt: string;

  businessName: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;

  orderId: UUID;
  orderNumber: string;
  orderSlug: string | null;
  businessDate: string | null;
  openedAt: string | null;
  closedAt: string | null;
  orderStatus: string | null;
  paymentStatus: string | null;
  servedBy: string | null;
  customerName: string | null;
  customerPhone: string | null;

  items: ReceiptDtoLineItem[];

  subtotal: number | null;
  discountAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;

  payments: ReceiptDtoPayment[];
  amountPaid: number | null;
  amountDue: number | null;
  tipAmount: number | null;

  currency: string;
  receiptUrl: string | null;
}

export interface VfdPrintResponse {
  orderId: UUID;
  orderNumber: string;
  fiscalReceiptNumber: string | null;
  fiscalDeviceSerial: string | null;
  signedAt: string | null;
  qrCodeData: string | null;
  verificationUrl: string | null;
  /** "STUBBED" while the Accounting integration is pending; "SIGNED" once live. */
  accountingServiceStatus: string | null;
  message: string | null;
}

export interface OrderDetail {
  id: UUID;
  slug: string | null;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string | null;
  orderType: string | null;
  servingType: string | null;
  fulfillmentStatus: string | null;
  orderSource: string | null;
  platformType: string | null;
  businessDate: string | null;
  notes: string | null;

  grossAmount: number | null;
  discountAmount: number | null;
  customerChargesTotal: number | null;
  netAmount: number | null;
  paidAmount: number | null;
  unpaidAmount: number | null;
  signedAmount: number | null;
  totalTipAmount: number | null;
  taxAmount: number | null;
  totalCostPrice: number | null;
  businessCostsTotal: number | null;
  grossProfit: number | null;
  profitMargin: number | null;

  openedDate: string;
  closedDate: string | null;
  durationMinutes: number | null;

  startedBy: OrderDetailStaff | null;
  assignedTo: OrderDetailStaff | null;
  finishedBy: OrderDetailStaff | null;
  customer: OrderDetailCustomer | null;

  items: OrderDetailItem[];
  removedItems: OrderDetailItem[];
  itemCount: number;
  uniqueItemCount: number;

  costs: OrderCost[];
  transactions: OrderDetailTransaction[];
  refunds: OrderDetailRefund[];
  timeline: OrderDetailTimelineEvent[];

  createdAt: string;
  updatedAt: string;
  version: number | null;
}

// ─── Standalone timeline event ──────────────────────────────────────
// Returned from `GET /orders/{id}/timeline` for fuller event drill-down
// when the embedded `timeline` slice on the detail response isn't enough.

export interface OrderEvent {
  id: UUID;
  orderId: UUID;
  eventType: string;
  actorId: UUID | null;
  actorType: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

// ─── Display helpers ────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.OPEN]: "Open",
  [OrderStatus.CLOSED]: "Closed",
  [OrderStatus.CANCELLED]: "Cancelled",
  [OrderStatus.ABANDONED]: "Abandoned",
};

export const ORDER_STATUS_PILL: Record<OrderStatus, string> = {
  [OrderStatus.OPEN]:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  [OrderStatus.CLOSED]:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  [OrderStatus.CANCELLED]:
    "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  [OrderStatus.ABANDONED]:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.NOT_PAID]: "Unpaid",
  [PaymentStatus.PARTIAL]: "Partial",
};

export const PAYMENT_STATUS_PILL: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  [PaymentStatus.PARTIAL]:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  [PaymentStatus.NOT_PAID]:
    "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.IMMEDIATE]: "Immediate",
  [OrderType.RESERVATION]: "Reservation",
  [OrderType.DINE_IN]: "Dine-in",
  [OrderType.TAKEAWAY]: "Takeaway",
  [OrderType.DELIVERY]: "Delivery",
  [OrderType.DRIVE_THRU]: "Drive-thru",
};

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  [OrderSource.POS]: "POS",
  [OrderSource.ONLINE]: "Online",
  [OrderSource.QR]: "QR",
  [OrderSource.TABLE]: "Table",
  [OrderSource.DELIVERY]: "Delivery",
  [OrderSource.KIOSK]: "Kiosk",
  [OrderSource.API]: "API",
  [OrderSource.MARKETPLACE]: "Marketplace",
};

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  [FulfillmentStatus.DRAFT]: "Draft",
  [FulfillmentStatus.PENDING_PAYMENT]: "Pending payment",
  [FulfillmentStatus.CONFIRMED]: "Confirmed",
  [FulfillmentStatus.PREPARING]: "Preparing",
  [FulfillmentStatus.READY]: "Ready",
  [FulfillmentStatus.SERVED]: "Served",
  [FulfillmentStatus.COMPLETED]: "Completed",
  [FulfillmentStatus.AWAITING_PICKUP]: "Awaiting pickup",
  [FulfillmentStatus.PICKED_UP]: "Picked up",
  [FulfillmentStatus.IN_TRANSIT]: "In transit",
  [FulfillmentStatus.DELIVERED]: "Delivered",
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Open", value: OrderStatus.OPEN },
  { label: "Closed", value: OrderStatus.CLOSED },
  { label: "Cancelled", value: OrderStatus.CANCELLED },
  { label: "Abandoned", value: OrderStatus.ABANDONED },
];

// ─── Legacy types kept for receipts / reports ───────────────────────
// These predate the OMS migration and feed the receipt + delivery-note
// + cash-flow / credit report pages, which still talk to the old
// receipt endpoints. They live here to keep those pages compiling.

export interface OrderItems {
  id: UUID;
  name: string;
  quantity: number;
  image: string;
  hasBeenRefunded: boolean;
  price: number;
  itemPrice: number;
  cost: number;
  discountValue: number;
  discountAmount: number;
  netAmount: number;
  grossProfit: number;
  comment: string;
  preparationStatus: boolean;
  canDelete: boolean;
  isArchived: boolean;
  status: boolean;
  staffId: UUID;
  staffName: string;
  departmentName: string;
  variant: UUID;
  discountId: UUID;
  stockIntake: string;
  stockIntakeBatchNumber: string;
  modifier: string;
  modifierPrice: string;
  addons: string;
  addonTotalPrice: string;
  totalPrice: number;
  [key: string]: unknown;
}

interface PaymentMethods {
  paymentMethodName: string;
  amount: number;
}

export interface CashFlow {
  startDate: Date;
  endDate: Date;
  transactions: number;
  expensePayments: number;
  refunds: number;
  transactionsAmount: number;
  refundsAmount: number;
  expensesPaidAmount: number;
  closingBalance: number;
  paymentMethodTotals: PaymentMethods[];
}

/**
 * One day on the cash-flow trend, from
 * `GET /api/v2/analytics/cash-flow/daily` (Reports Service). Summing each
 * field over the range reproduces the matching `/api/v2/analytics/overview`
 * total — same fact tables and filters, grouped by business_date.
 */
export interface CashFlowDailyPoint {
  /** Calendar day, yyyy-MM-dd. */
  date: string;
  /** Money in — settled transactions (is_refund = 0). */
  cashIn: number;
  /** Refunds paid out that day. */
  refundsAmount: number;
  /** Expenses paid out that day. */
  expensesPaidAmount: number;
  /** cashIn − refundsAmount − expensesPaidAmount. */
  net: number;
}

interface UnpaidOrders {
  orderId: UUID;
  orderName: string;
  orderNumber: string;
  openedDate: Date;
  paidAmount: number;
  unpaidAmount: number;
  customerName: string;
  customerId: UUID;
  firstPaymentDate: Date;
  lastPaymentDate: Date;
}

export interface Credit {
  startDate: Date;
  endDate: Date;
  total: number;
  totalUnpaidAmount: number;
  totalPaidAmount: number;
  unpaidOrders: UnpaidOrders[];
}

// ─── Voids report ────────────────────────────────────────────────────

export interface VoidReasonTally {
  reason: VoidReason;
  count: number;
  amount: number;
}

export interface VoidsSummary {
  totalOrders: number;
  voidedOrders: number;
  voidedItems: number;
  voidAmount: number;
  currency: string | null;
  reasons: VoidReasonTally[];
}

export interface OrderVoidsResponse {
  summary: VoidsSummary;
  orders: Order[];
}

export const VOID_REASON_LABELS: Record<VoidReason, string> = {
  [VoidReason.CUSTOMER_REQUEST]: "Customer request",
  [VoidReason.WRONG_ITEM]: "Wrong item",
  [VoidReason.DUPLICATE]: "Duplicate",
  [VoidReason.STAFF_ERROR]: "Staff error",
  [VoidReason.QUALITY]: "Quality",
  [VoidReason.OUT_OF_STOCK]: "Out of stock",
  [VoidReason.OTHER]: "Other",
};

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  [CancellationReason.CUSTOMER_REQUEST]: "Customer request",
  [CancellationReason.OUT_OF_STOCK]: "Out of stock",
  [CancellationReason.KITCHEN_ISSUE]: "Kitchen issue",
  [CancellationReason.PAYMENT_FAILED]: "Payment failed",
  [CancellationReason.DUPLICATE]: "Duplicate",
  [CancellationReason.FRAUD]: "Fraud",
  [CancellationReason.STAFF_ERROR]: "Staff error",
  [CancellationReason.OTHER]: "Other",
};
