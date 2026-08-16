import { Location } from "@/types/location/type";

// Mirrors BusinessResponse from the Settlo Accounts Service
// (`/api/v1/businesses/{id}`). Server-managed `identifier`, auto-assigned
// `accountId`, and server timestamps are included. `businessTypeId`/
// `businessTypeName`/`baseCurrency` are not returned by the accounts service
// (business type is modelled on Location; baseCurrency is an internal entity
// default). They remain optional here because other dashboard surfaces
// (sidebar, switcher, auth session) still reference them.
export declare interface Business {
  id: string;
  accountId: string;
  identifier: string;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  website: string;
  active: boolean;
  countryId: string;
  businessTypeId?: string;
  businessTypeName?: string;
  region: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
  logoUrl: string;
  baseCurrency?: string;
  createdAt: string;
  updatedAt: string;
  // Cross-account fields — provided by /api/v1/me/all-businesses; absent on
  // single-account endpoints such as /me/businesses.
  owner?: boolean;
  accountName?: string;
  relationship?: "OWNER" | "MEMBER" | "STAFF";
}

export declare interface MinimalBusiness {
  id: string;
  identifier: string;
  name: string;
  businessTypeId?: string;
  businessTypeName?: string;
  logoUrl: string | null;
  active: boolean;
  accountId: string;
  countryId: string;
}

export declare interface BusinessWithLocationType {
  business: Business;
  locations: Location[];
}

// ── BusinessSettings ────────────────────────────────────────────────
// Mirrors the backend BusinessSettingsResponse + UpdateBusinessSettingsRequest
// from Settlo Accounts Service (`/api/v1/businesses/{businessId}/settings`).

export type EfdStatus = "REQUESTED" | "AWAITING_CONFIRMATION" | "ACTIVE";

// AUTO derives registration from `vatRegistrationNumber` presence; the other
// two are an explicit override in either direction. Mirrors the Accounts
// Service's `VatRegistrationMode` enum.
export type VatRegistrationMode = "AUTO" | "REGISTERED" | "NOT_REGISTERED";

export interface BusinessSettings {
  id: string;
  accountId: string;
  businessId: string;
  businessName?: string | null;

  // Legal entity
  businessLicenseNumber: string | null;
  companyRegistrationNumber: string | null;
  taxIdentificationNumber: string | null;
  establishedYear: number | null;

  // EFD
  efdSerialNumber: string | null;
  vatRegistrationNumber: string | null;
  /** Explicit override (REGISTERED/NOT_REGISTERED) or AUTO to derive from `vatRegistrationNumber`. */
  vatRegistrationMode: VatRegistrationMode;
  /** Resolved answer: `vatRegistrationMode`'s override if set, else whether `vatRegistrationNumber` is non-blank. Authoritative — read this rather than re-deriving from the VRN. */
  effectivelyVatRegistered: boolean;
  uniqueIdentificationNumber: string | null;
  enableVirtualEfd: boolean;
  efdStatus: EfdStatus | null;

  // Social media (parent company)
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  tiktokUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  whatsappNumber: string | null;

  // Template
  defaultCurrency: string | null;

  // Consolidated reports
  notificationEmail: string | null;
  notificationPhone: string | null;
  sendConsolidatedDailyReport: boolean;
  sendConsolidatedWeeklyReport: boolean;
  sendConsolidatedMonthlyReport: boolean;

  // Procurement
  requirePurchaseRequisitionApproval: boolean;
  supplierPerformanceTrackingEnabled: boolean;
  landedCostTrackingEnabled: boolean;
  locationToLocationTransferEnabled: boolean;

  // Legal text
  termsAndConditions: string | null;
  privacyPolicy: string | null;
  returnPolicy: string | null;

  createdAt: string;
  updatedAt: string;
}

export const EFD_STATUS_OPTIONS: { value: EfdStatus; label: string }[] = [
  { value: "REQUESTED", label: "Requested" },
  { value: "AWAITING_CONFIRMATION", label: "Awaiting confirmation" },
  { value: "ACTIVE", label: "Active" },
];
