import { UUID } from "node:crypto";

// --- Payment Method Tree ---
//
// Mirrors backend PaymentMethodResponseDto. `integrationCapable` is true
// when the method has a provider definition (capability). `providerConnected`
// is true only when the business has set up that provider — used by the UI
// to decide whether to surface a "Connect" CTA next to the method.
//
// Classification flags (cashEquivalent / complimentaryEquivalent /
// signedBillEquivalent / alwaysInstant) come from the backend seed data
// and drive badges in the panel — do not infer from `code` strings.

export interface PaymentMethodChild {
  id: UUID;
  code: string;
  displayName: string;
  enabled: boolean;
  providerId: UUID | null;
  providerName: string | null;
  providerSlug: string | null;
  integrationCapable: boolean;
  providerConnected: boolean;
  sortOrder: number;
  cashEquivalent: boolean;
  complimentaryEquivalent: boolean;
  signedBillEquivalent: boolean;
  alwaysInstant: boolean;
  children: null;
}

export interface PaymentMethod {
  id: UUID;
  code: string;
  displayName: string;
  enabled: boolean;
  providerId: UUID | null;
  providerName: string | null;
  providerSlug: string | null;
  integrationCapable: boolean;
  providerConnected: boolean;
  sortOrder: number;
  cashEquivalent: boolean;
  complimentaryEquivalent: boolean;
  signedBillEquivalent: boolean;
  alwaysInstant: boolean;
  children: PaymentMethodChild[] | null;
}

// --- Provider ---

export interface CredentialField {
  fieldName: string;
  displayName: string;
  fieldType: "STRING" | "SECRET";
  required: boolean;
  encrypted: boolean;
}

export interface Provider {
  id: UUID;
  name: string;
  slug: string;
  baseUrl: string;
  authType: string;
  integrationMode: string;
  status: string;
  credentialFields: CredentialField[];
}

export interface BusinessProviderConfig {
  id: UUID;
  businessId: UUID;
  providerSlug: string;
  providerName: string;
  enabled: boolean;
  configuredCredentialKeys: string[];
  configOverrides: Record<string, string> | null;
}

export interface ConfigureProviderRequest {
  providerSlug: string;
  enabled: boolean;
  credentials: Record<string, string>;
  configOverrides?: Record<string, string>;
  createdBy?: string;
}

export interface LocationOverride {
  locationId: string;
  enabled: boolean;
  credentialOverrides?: Record<string, string>;
  configOverrides?: Record<string, string>;
}

// --- Location Payment Method Toggle ---

export interface TogglePaymentMethodRequest {
  enabled: boolean;
}
