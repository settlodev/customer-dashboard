/**
 * One refunded line, mirroring the Reports Service {@code RefundReportDto} 1:1
 * (Jackson camelCase). `returnedCost` is the COGS of the refunded units, derived
 * server-side; null when the refund's line couldn't be found for costing.
 */
export interface RefundReportRow {
  id: string;
  orderId: string | null;
  orderItemId: string | null;
  orderNumber: string | null;
  orderItemName: string | null;
  businessDate: string | null;
  quantity: number;
  refundNetAmount: number;
  returnedCost: number | null;
  stockReturned: boolean;
  /** Free-text note the cashier typed. */
  reason: string | null;
  /** The picked `RefundReason` enum — the list's filter dimension. */
  reasonType: string | null;
  refundType: string | null;
  refundDate: string | null;
  refundedByName: string | null;
  approvedByName: string | null;
}

/**
 * Paged refund details, mirroring {@code RefundDetailsResponseDto}. The summary
 * totals (`totalRefundCount` / `totalRefundedAmount` / `totalReturnedCost`) are
 * range-wide and independent of the page, so the KPI strip never changes as the
 * user pages. `refunds` is the current page's rows only.
 */
export interface RefundDetailsResponse {
  locationName: string | null;
  startDate: string | null;
  endDate: string | null;
  totalRefundCount: number;
  totalRefundedAmount: number;
  totalReturnedCost: number;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  refunds: RefundReportRow[];
}
