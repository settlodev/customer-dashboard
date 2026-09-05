import {
  Gender,
  CustomerSource,
  CustomerCreatedFrom,
  AddressType,
} from "@/types/enums";
import { UUID } from "node:crypto";

export declare interface CustomerAddress {
  id: UUID;
  accountId: UUID;
  customerId: UUID;
  addressType: AddressType;
  addressLine: string;
  createdAt: string;
  updatedAt: string;
}

export declare interface CustomerPreference {
  id: UUID;
  accountId: UUID;
  customerId: UUID;
  preferenceKey: string;
  preferenceValue: string;
  createdAt: string;
  updatedAt: string;
}

export declare interface Customer {
  id: UUID;
  accountId: UUID;
  businessId: UUID;
  businessName: string | null;
  locationId: UUID;
  locationName: string | null;
  identifier: string;
  customerAccountNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  idType: string | null;
  idNumber: string | null;
  tinNumber: string | null;
  vrn: string | null;
  creditLimit: number | null;
  /**
   * Optional catchment region — free text, same shape as the region on a
   * business or location. Null for most customers; the customers list drops
   * the column entirely when nobody at the location has one.
   */
  region: string | null;
  /**
   * Client-enriched on the customers list from the prepayment analytics
   * balance map — NOT part of the Accounts customer payload. Surfaced as
   * "Credit": prepaid money the business still owes this customer.
   */
  prepaidBalance?: number;
  /**
   * Outstanding A/R — what this customer owes on unsettled signed bills.
   * Client-enriched on the customers list from the location's debtor
   * balances, same as {@link prepaidBalance}; not part of the Accounts
   * customer payload.
   */
  totalDue?: number;
  /**
   * Revenue-bearing orders this customer has placed. Client-enriched on the
   * customers list from the Reports customer purchase summary, same as
   * {@link prepaidBalance}; not part of the Accounts customer payload.
   */
  orderCount?: number;
  /**
   * Total net spend across those orders. Client-enriched alongside
   * {@link orderCount}.
   */
  lifetimeValue?: number;
  allowNotifications: boolean;
  notes: string | null;
  loyaltyPoints: number;
  loyaltyPointsCarryOver: number;
  source: CustomerSource | null;
  createdFrom: CustomerCreatedFrom | null;
  noShowCount: number;
  active: boolean;
  isArchived: boolean;
  customerGroupId: UUID | null;
  customerGroupName: string | null;
  addresses: CustomerAddress[];
  preferences: CustomerPreference[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Reports Service roll-up over `fact_orders` for one customer — how many
 * revenue-bearing orders they have placed and what they spent in total.
 * Cancelled / written-off / deferred / merged orders are excluded upstream.
 */
export declare interface CustomerPurchaseSummary {
  customerId: UUID;
  orderCount: number;
  lifetimeValue: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  firstOrderDate: string | null;
}

// ─── Reports Service: per-customer, per-location insights ───────────
// `GET /api/v2/analytics/customers/{id}/insights?locationId=` — one read
// behind the customer detail page's Behaviour card, rank, spend-by-month
// chart and favourites. Every section is independently nullable/empty: the
// service drops a section that fails rather than failing the call.

/** RFM segment written by the nightly per-location LTV job. */
export type CustomerSegment =
  | "CHAMPION"
  | "LOYAL"
  | "NEW"
  | "AT_RISK"
  | "CANT_LOSE"
  | "LOST"
  | "BIG_SPENDER"
  | "REGULAR";

export const CUSTOMER_SEGMENT_LABELS: Record<CustomerSegment, string> = {
  CHAMPION: "Champion",
  LOYAL: "Loyal",
  NEW: "New",
  AT_RISK: "At risk",
  CANT_LOSE: "Can't lose",
  LOST: "Lost",
  BIG_SPENDER: "Big spender",
  REGULAR: "Regular",
};

export declare interface CustomerBehaviour {
  /** Feature date the row was computed for — the "as of" date. */
  asOf: string | null;
  segment: CustomerSegment | string | null;
  atRisk: boolean;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  lifetimeDays: number;
  lifetimeOrders: number;
  lifetimeSpend: number;
  daysSinceLastOrder: number;
  /** Mean gap between distinct purchase days; 0 with a single purchase day. */
  avgDaysBetweenOrders: number;
  predictedNextOrderDays: number;
  avgBasketSize: number;
  avgBasketValue: number;
  /** Percentages, 0–100 (the job multiplies by 100). */
  avgDiscountPercentage: number;
  ordersWithDiscountPct: number;
  pctDineIn: number;
  pctTakeaway: number;
  pctDelivery: number;
  /** Signed fractions: last 30 days vs the 30 before, 0.12 = up 12%. */
  spendTrend30d: number;
  frequencyTrend30d: number;
}

export declare interface CustomerRank {
  /** 1 = the location's biggest spender. */
  position: number;
  /** Identified customers who have bought at the location. */
  customerCount: number;
}

export declare interface CustomerMonthPoint {
  /** `yyyy-MM`. */
  month: string;
  orders: number;
  net: number;
  grossProfit: number;
}

export declare interface CustomerFavourite {
  /** Product id for an item, category id for a category; null when unknown. */
  id: UUID | null;
  name: string;
  quantity: number;
  net: number;
  orders: number;
  lastBought: string | null;
}

export declare interface CustomerInsights {
  customerId: UUID;
  locationId: UUID;
  /** Null until the nightly job has scored this customer at this location. */
  behaviour: CustomerBehaviour | null;
  /** Null when the customer has never bought at this location. */
  rank: CustomerRank | null;
  /** Last twelve calendar months, oldest first, zero rows for quiet months. */
  monthly: CustomerMonthPoint[];
  favouriteItems: CustomerFavourite[];
  favouriteCategories: CustomerFavourite[];
}

export declare interface CustomerGroup {
  id: UUID;
  accountId: UUID;
  businessId: UUID;
  locationId: UUID;
  identifier: string;
  slug: string;
  name: string;
  description: string | null;
  active: boolean;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  [CustomerSource.POS]: "POS",
  [CustomerSource.ONLINE]: "Online",
  [CustomerSource.GOOGLE]: "Google",
  [CustomerSource.INSTAGRAM]: "Instagram",
  [CustomerSource.REFERRAL]: "Referral",
  [CustomerSource.WALK_IN]: "Walk-in",
};

export const CUSTOMER_CREATED_FROM_LABELS: Record<CustomerCreatedFrom, string> =
  {
    [CustomerCreatedFrom.POS]: "POS",
    [CustomerCreatedFrom.MOBILE_APP]: "Mobile App",
    [CustomerCreatedFrom.WEBSITE]: "Website",
    [CustomerCreatedFrom.RESERVATION]: "Reservation",
  };

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  [AddressType.HOME]: "Home",
  [AddressType.WORK]: "Work",
  [AddressType.OTHER]: "Other",
};
