import { ApiResponse } from "@/types/types";

export interface AdminBusinessListItem {
  id: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  baseCurrency: string;
  phoneNumber: string | null;
  email: string | null;
  region: string | null;
  district: string | null;

  accountId: string;
  accountFullName: string | null;
  accountEmail: string | null;
  accountNumber: string | null;

  locationCount: number;
  activeLocationCount: number;

  createdAt: string;
}

export interface AdminBusinessDetail {
  id: string;
  name: string;
  slug: string;
  identifier: string;
  description: string | null;
  active: boolean;
  baseCurrency: string;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;

  region: string | null;
  district: string | null;
  ward: string | null;
  address: string | null;
  postalCode: string | null;

  countryId: string | null;
  countryCode: string | null;
  countryName: string | null;

  accountId: string;
  accountFullName: string | null;
  accountEmail: string | null;
  accountPhoneNumber: string | null;
  accountNumber: string | null;
  accountActive: boolean;

  locationCount: number;
  activeLocationCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface AdminLocationListItem {
  id: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  businessId: string;
  businessName: string | null;
  accountId: string;
  phoneNumber: string | null;
  email: string | null;
  businessTypeId: string | null;
  businessTypeName: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
  address: string | null;
  timezone: string | null;
  createdAt: string;
}

export interface AdminLocationDetail extends AdminLocationListItem {
  description: string | null;
  website: string | null;
  countryId: string | null;
  countryCode: string | null;
  countryName: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  logo: string | null;
  updatedAt: string;
}

export interface AdminWarehouseListItem {
  id: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  businessId: string;
  accountId: string;
  code: string | null;
  capacity: number | null;
  primary: boolean;
  createdAt: string;
}

export interface AdminStoreListItem {
  id: string;
  name: string;
  slug: string;
  identifier: string;
  active: boolean;
  businessId: string;
  accountId: string;
  locationId: string;
  code: string | null;
  createdAt: string;
}

export type AdminBusinessPage = ApiResponse<AdminBusinessListItem>;

export interface ListBusinessesParams {
  page?: number;
  size?: number;
  accountId?: string;
  search?: string;
  active?: boolean;
}

export interface BusinessStatusCounts {
  total: number;
  active: number;
  inactive: number;
}
