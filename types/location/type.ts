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
  region: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  website: string;
  createdAt: string;
  updatedAt: string;
}
