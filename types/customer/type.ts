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
