import { UUID } from "node:crypto";

// Mirrors the Accounts Service prepayment DTOs
// (co.tz.settlo.accounts.prepayments.dto.*).

export type PrepaymentStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "FULLY_CONSUMED"
  | "EXPIRED"
  | "VOIDED";

export type PrepaymentScope = "LOCATION_ONLY" | "BUSINESS_WIDE";

export type PrepaymentSourceType =
  | "TOPUP"
  | "RESERVATION_DEPOSIT"
  | "MANUAL_ADJUSTMENT";

export type PrepaymentTransactionType =
  | "ISSUED"
  | "REDEEMED"
  | "REFUNDED"
  | "EXPIRED"
  | "VOIDED";

/** A discrete prepaid balance (one top-up). PrepaymentResponse. */
export interface PrepaymentInstrument {
  id: UUID;
  accountId: UUID;
  businessId: UUID;
  locationId: UUID;
  scopeType: PrepaymentScope;
  status: PrepaymentStatus;
  customerId: UUID;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  issuedByStaffId: UUID | null;
  issuedAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  fullyConsumedAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  sourceType: PrepaymentSourceType;
  sourceReference: string | null;
  paymentMethodId: UUID | null;
  paymentTransactionId: UUID | null;
}

/** A ledger row on an instrument. PrepaymentTransactionResponse. */
export interface PrepaymentTransaction {
  id: UUID;
  prepaymentInstrumentId: UUID;
  type: PrepaymentTransactionType;
  amount: number; // signed: + credits (ISSUED, REFUNDED), − debits
  balanceAfter: number;
  orderId: UUID | null;
  orderTransactionId: UUID | null;
  staffId: UUID | null;
  customerId: UUID | null;
  notes: string | null;
  createdAt: string;
}

/** AvailableBalanceResponse. */
export interface PrepaymentAvailableBalance {
  customerId: UUID;
  businessId: UUID;
  locationId: UUID;
  currency: string;
  availableBalance: number;
}

/** PrepaymentSettingsResponse. */
export interface PrepaymentSettings {
  id: UUID;
  accountId: UUID;
  locationId: UUID;
  enabled: boolean;
  defaultExpirationDays: number | null;
  allowBusinessWide: boolean;
  minTopupAmount: number;
  maxTopupAmount: number | null;
}

/** Aggregated view for the customer-detail Prepaid account tab. */
export interface CustomerPrepaymentOverview {
  availableBalance: number;
  currency: string;
  instruments: PrepaymentInstrument[];
  transactions: PrepaymentTransaction[];
}

// ── Reports Service analytics (co.tz.settlo.analytics.prepayment.dto.*) ──

export interface PrepaymentAnalyticsOverview {
  locationId: UUID;
  startDate: string;
  endDate: string;
  topUpCount: number;
  totalToppedUpValue: number;
  redemptionCount: number;
  totalRedeemedValue: number;
  fullyConsumedCount: number;
  totalBreakageValue: number;
  expiredCount: number;
  voidedCount: number;
  totalRefundedValue: number;
  outstandingLiability: number;
  redemptionRate: number;
  avgTopUpValue: number;
  avgRedemptionValue: number;
}

export interface PrepaymentTrendPoint {
  date: string;
  topUpCount: number;
  toppedUpValue: number;
  redeemedCount: number;
  redeemedValue: number;
}

export interface CustomerPrepaymentBalance {
  customerId: UUID;
  customerName: string | null;
  currency: string | null;
  outstandingBalance: number;
}
