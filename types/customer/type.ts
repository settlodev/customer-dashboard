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
   * Client-enriched on the customers list from the prepayment analytics
   * balance map — NOT part of the Accounts customer payload.
   */
  prepaidBalance?: number;
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
