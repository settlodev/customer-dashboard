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
