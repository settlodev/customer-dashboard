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
  // Source order whose items were moved into another order by a merge —
  // not a cancellation, the items live on in the target.
  MERGED = "MERGED",
  // Unpaid order written off as a loss (walkout); no revenue recognised.
  WRITTEN_OFF = "WRITTEN_OFF",
  // Parked unpaid order deferred for later payment with no customer
  // attached; resolves to CLOSED or WRITTEN_OFF.
  DEFERRED = "DEFERRED",
  // A closed order still carrying a signed-bill receivable — a sale put on
  // the customer's account and not yet settled. Presentation-only: the OMS
  // stores it as CLOSED and returns SIGNED only to callers sending
  // `X-Order-Status-Version: 2` (the dashboard's orders client does). Also a
  // filter value on the search endpoints, meaning "closed and still owed".
  // Settling returns the order to CLOSED; a write-off moves it to WRITTEN_OFF.
  SIGNED = "SIGNED",
}

/**
 * Closed in the till's sense — the order is finished, whether it was paid
 * (CLOSED) or put on the customer's account (SIGNED). Use for gates that
 * mean "no longer being served", not "paid".
 */
export const isClosedOrder = (status: OrderStatus | string | null | undefined) =>
  status === OrderStatus.CLOSED || status === OrderStatus.SIGNED;

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
  /**
   * Free-text label the cashier gave the order at the till ("John's table",
   * "Birthday party"). Null for the many orders nobody named. It outranks
   * both the table name and the order number as the order's handle — it is
   * the one the staff who took the order recognise.
   */
  orderName: string | null;
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

  /**
   * Settlement-currency total of every refund raised against this order.
   * Present on the list projection (`GET /orders/search`) so the orders table
   * can mark a refunded row without fetching each order's refunds; null when
   * the order has none. See {@link orderRefundBadge}.
   */
  refundedAmount: number | null;
  /**
   * Display name of {@link customerId}, resolved by the OMS from its customer
   * reference mirror on the list projection (`GET /orders/search`) so the
   * orders table can show who an order was for without a per-row customer
   * fetch. Null for walk-in orders (most of them); absent on the full
   * `GET /orders/{id}` response, which carries the customer under `customer`.
   */
  customerName?: string | null;

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
//   POST   /api/v1/orders/{id}/prints/vfd         → VfdPrintResponse (real TRA fiscal signing; idempotent per order)

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
  // Issuer letterhead (resolved server-side, location-first / business
  // fallback) — same block the Accounting invoice documents carry.
  issuerEmail?: string | null;
  issuerTin?: string | null;
  issuerVrn?: string | null;
  issuerLogoUrl?: string | null;
  issuerWebsite?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  issuerCountry?: string | null;

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

/**
 * The stored DIRM/VFD fiscal receipt for an order — the nested detail
 * returned alongside {@link VfdPrintResponse}'s flat fields. Idempotent:
 * a reprint returns the same stored receipt without re-fiscalising.
 */
export interface VfdReceiptDetail {
  orderId: UUID;
  accountingId: UUID;
  data: {
    dateTime: string | null;
    rctNum: number | null;
    zNum: number | null;
    receiptStatus: string | null;
    vrn: string | null;
    traReceiptVerificationCode: string | null;
    traReceiptVerificationUrl: string | null;
  } | null;
  totals: {
    totalTaxExcl: number;
    totalTaxIncl: number;
    totalTax: number;
    discount: number;
  } | null;
  vatTotals: Array<{
    vatRate: string;
    nettAmount: number;
    taxAmount: number;
  }>;
  vfdInformation: {
    uin: string | null;
    taxOffice: string | null;
    tin: number | null;
    vrn: string | null;
    isVatRegistered: boolean | null;
    tradingName: string | null;
    physicalAddress: string | null;
    mobile: string | null;
    street: string | null;
  } | null;
  clientInformation: {
    businessName: string | null;
    physicalAddress: string | null;
    email: string | null;
    mobile: string | null;
  } | null;
}

export interface VfdPrintResponse {
  orderId: UUID;
  orderNumber: string;
  /** DIRM rctNum. */
  fiscalReceiptNumber: string | null;
  /** UIN of the signing fiscal device. */
  fiscalDeviceSerial: string | null;
  signedAt: string | null;
  qrCodeData: string | null;
  /** TRA verification URL. */
  verificationUrl: string | null;
  /** "SIGNED" once the Accounting Service has fiscalised the receipt. */
  accountingServiceStatus: string | null;
  message: string | null;
  /** Full stored fiscal receipt — present once the order has been signed. */
  receipt?: VfdReceiptDetail | null;
}

export interface OrderDetail {
  id: UUID;
  slug: string | null;
  orderNumber: string;
  /** Cashier's own label for the order — see `Order.orderName`. */
  orderName: string | null;
  /** Table this order sits on, resolved server-side. Null when none. */
  tableName: string | null;
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
  [OrderStatus.MERGED]: "Merged",
  [OrderStatus.WRITTEN_OFF]: "Written off",
  [OrderStatus.DEFERRED]: "Deferred",
  [OrderStatus.SIGNED]: "Signed",
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
  [OrderStatus.MERGED]:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  [OrderStatus.WRITTEN_OFF]:
    "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  [OrderStatus.DEFERRED]:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  [OrderStatus.SIGNED]:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
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

/**
 * The refund marker for an order row, or null when nothing was refunded.
 *
 * <p>Reads `refundedAmount` (the settlement-currency sum the OMS list
 * projection carries) against the order's net amount, so a reversal of the
 * whole sale reads differently from one line sent back. The comparison is
 * deliberately tolerant by a cent: refunds are summed per item and can land
 * fractionally short of the order total through rounding, and an order the
 * customer got all their money back on should not read "Partly refunded".
 */
export const orderRefundBadge = (
  order: Pick<Order, "refundedAmount" | "netAmount">,
): { label: string; full: boolean } | null => {
  const refunded = order.refundedAmount ?? 0;
  if (refunded <= 0) return null;
  const net = order.netAmount ?? 0;
  const full = net > 0 && refunded >= net - 0.01;
  return { label: full ? "Refunded" : "Part refunded", full };
};

/**
 * Pill styling for {@link orderRefundBadge}. A sale reversed in full is money
 * that left again — it reads in the same rose the unpaid figures use — while a
 * partial return is amber, the shade the rest of the table gives to "attend to
 * this" rather than "this is a loss".
 */
/**
 * Marker for a row still carrying a signed-bill receivable — the order was
 * put on the customer's account and is owed until settled or written off.
 * Rides under the status pill like the refund marker.
 */
export const SIGNED_BILL_PILL =
  "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400";

export const REFUND_PILL: Record<"full" | "partial", string> = {
  full: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  partial:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
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
  { label: "Signed", value: OrderStatus.SIGNED },
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

// ─── Close-of-Day session reports (OMS) ─────────────────────────────
// Session-scoped refund/void listings backing the dashboard's
// Close-of-Day report. Distinct from OrderVoidsResponse above (a
// date-range report keyed by order); these are flat listings keyed by
// daySessionId.
//   GET /api/v1/orders/sessions/{sessionId}/refunds
//   GET /api/v1/orders/sessions/{sessionId}/voids

export interface DaySessionRefundItem {
  id: UUID;
  orderItemId: UUID;
  /** Parent order's human ticket number (OMS-enriched). */
  orderNumber?: string | null;
  /** Refunded item name (OMS-enriched). */
  itemName?: string | null;
  quantity: number;
  reason: string | null;
  processedBy: UUID | null;
  approvedBy: UUID | null;
  refundedAt: string | null;
  refundAmount: number;
  refundCurrency: string | null;
  paymentMethodId: UUID | null;
  paymentMethodCode: string | null;
  daySessionId: UUID;
  businessDate: string;
}

export interface DaySessionRefundsResponse {
  locationId: UUID;
  daySessionId: UUID;
  refunds: DaySessionRefundItem[];
  totalAmount: number;
  count: number;
}

export interface DaySessionVoidItem {
  orderId: UUID;
  orderNumber: string;
  orderItemId: UUID;
  itemName: string;
  quantity: number;
  voidReason: VoidReason | null;
  staffId: UUID | null;
  removedBy: UUID | null;
  removedAt: string | null;
  approvedBy: UUID | null;
  approvalRequestId: UUID | null;
  netAmount: number;
}

/** A cancelled full-ticket order, as returned alongside item voids. */
export interface DaySessionCancelledOrderItem {
  orderId: UUID;
  orderNumber: string;
  cancellationReason: string | null;
  cancelledBy: UUID | null;
  cancelledAt: string | null;
  netAmount: number;
}

export interface DaySessionVoidsResponse {
  locationId: UUID;
  daySessionId: UUID;
  items: DaySessionVoidItem[];
  totalVoidedAmount: number;
  count: number;
  cancelledOrders: DaySessionCancelledOrderItem[];
  totalCancelledAmount: number;
  cancelledCount: number;
}
