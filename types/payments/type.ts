import { UUID } from "node:crypto";

// --- Payment Method Tree ---

export interface PaymentMethodChild {
  id: UUID;
  code: string;
  displayName: string;
  enabled: boolean;
  integrationCapable: boolean;
  sortOrder: number;
  children: null;
}

export interface PaymentMethod {
  id: UUID;
  code: string;
  displayName: string;
  enabled: boolean;
  providerId: UUID | null;
  providerName: string | null;
  integrationCapable: boolean;
  sortOrder: number;
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
