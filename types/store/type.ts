export interface Store {
  id: string;
  accountId: string;
  businessId: string;
  locationId: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  storeNumber?: string;
  code?: string;
  storeType?: string;
  timezone?: string;
  region?: string;
  district?: string;
  ward?: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  id: string;
  accountId: string;
  storeId: string;
  [key: string]: unknown;
}
