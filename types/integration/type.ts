export type IntegrationProvider = "QUICKBOOKS" | "XERO";

export type IntegrationSyncStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISCONNECTED"
  | "ERROR";

export interface AccountingIntegration {
  id: string;
  provider: IntegrationProvider;
  externalCompanyId?: string | null;
  externalCompanyName?: string | null;
  syncStatus: IntegrationSyncStatus;
  lastSyncAt?: string | null;
  lastErrorMessage?: string | null;
  connected: boolean;
  tokenExpired: boolean;
  tokenScope?: string | null;
  connectedBy?: string | null;
  connectedAt?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationAccountMapping {
  id: string;
  integrationId: string;
  provider: IntegrationProvider;
  settloAccountId: string;
  externalAccountId: string;
  externalAccountName?: string | null;
  mappingType?: string | null;
  businessId: string;
}

export const INTEGRATION_SYNC_STATUS_TONES: Record<
  IntegrationSyncStatus,
  string
> = {
  ACTIVE: "bg-green-50 text-green-700",
  PAUSED: "bg-amber-50 text-amber-700",
  DISCONNECTED: "bg-gray-100 text-gray-500",
  ERROR: "bg-red-50 text-red-700",
};
