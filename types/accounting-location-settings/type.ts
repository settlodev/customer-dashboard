/**
 * Slim subset of location/business settings exposed by the Accounting
 * Service via `GET /api/v1/location-settings`. The Accounting Service
 * keeps its own cache of the fields it cares about (Kafka-fed from
 * Accounts Service), so the dashboard can read merchant config
 * without going through the Accounts Service every time.
 *
 *
 * For the full Accounts-Service location settings shape (200+ fields)
 * see `types/location-settings/type.ts`.
 */
export interface AccountingLocationSettings {
  locationId: string;
  businessId: string;

  currency: string;
  defaultCurrency: string;

  taxLabel?: string | null;
  pricesIncludeTax: boolean;
  defaultInvoiceDueDays?: number | null;
  defaultPaymentTerms?: string | null;

  minimumSettlementAmount?: number | null;

  timezone?: string | null;

  requireApprovalForVoids: boolean;
  locationToLocationTransferEnabled: boolean;

  businessLicenseNumber?: string | null;
  companyRegistrationNumber?: string | null;
  taxIdentificationNumber?: string | null;
  vatRegistrationNumber?: string | null;
  uniqueIdentificationNumber?: string | null;
  efdSerialNumber?: string | null;

  lastEventAt?: string | null;
}
