// Mirrors LocationResponse from the Settlo Accounts Service
// (`/api/v1/locations/{id}`). `identifier` and `slug` are server-managed;
// `accountId` / `businessId` are immutable once assigned. `website` is not
// returned by the accounts service (retained optional for legacy consumers
// reading older cached payloads).
export interface Location {
  id: string;
  accountId: string;
  businessId: string;
  businessName: string;
  identifier: string;
  name: string;
  description: string;
  phoneNumber: string;
  email: string;
  active: boolean;
  countryId: string;
  businessTypeId?: string;
  businessTypeName?: string;
  region: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}
