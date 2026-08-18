import type { UUID } from "node:crypto";

/**
 * One payment-method row from
 * `GET /api/v2/analytics/transactions/by-payment-method` on the reports
 * service (mirrors `PaymentMethodSummaryDto`). The server aggregates the
 * settled transactions over the requested date range and computes the
 * percentage share, so the dashboard only formats.
 */
export interface PaymentMethodBreakdown {
  acceptedPaymentMethodType: UUID | string;
  acceptedPaymentMethodTypeName: string;
  paymentType: string;
  transactionCount: number;
  totalAmount: number;
  /** Share of the period total, 0–100. Server-computed. */
  percentage: number;
}
