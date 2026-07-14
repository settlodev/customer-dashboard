import {
  Gender,
  CustomerSource,
  CustomerCreatedFrom,
  AddressType,
} from "@/types/enums";
import { UUID } from "node:crypto";

export declare interface Customer {
  id: UUID;
  firstName: string;
  lastName: string;
  name: string;
  customerAccountNumber: string;
  gender: Gender;
  phoneNumber: string;
  email: string | null;
  dateOfBirth: string | null;
  idType: string | null;
  idNumber: string | null;
  tinNumber: string | null;
  creditLimit: number | null;
  vrn: string | null;
  allowNotifications: boolean;
  totalSpend: number | null;
  noShowCount: number;
  notes: string | null;
  seatingPreference: string | null;
  loyaltyPoints: number | null;
  source: CustomerSource | null;
  createdFrom: CustomerCreatedFrom | null;
  lastReservationDate: string | null;
  customerGroup: UUID | null;
  customerGroupName: string | null;
  totalOrders: number | null;
  pendingOrders: number | null;
  closedOrders: number | null;
  orderRequests: number | null;
  lastVisit: string | null;
  addresses: CustomerAddress[];
  preferences: CustomerPreference[];
  isCompanyAssociated: boolean;
  companyName: string | null;
  companyRegistrationNumber: string | null;
  companyEmailAddress: string | null;
  companyPhysicalAddress: string | null;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
}

export declare interface CustomerAddress {
  id: UUID;
  addressType: AddressType;
  addressLine: string;
}

export declare interface CustomerPreference {
  id: UUID;
  preferenceKey: string;
  preferenceValue: string;
}

export declare interface CustomerGroup {
  id: UUID;
  name: string;
  totalCustomers: number;
  location: UUID;
  status: boolean;
  canDelete: boolean;
  isArchived: boolean;
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
