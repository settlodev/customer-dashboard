import { Location } from "@/types/location/type";

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
  businessTypeId: string;
  businessTypeName: string;
  region: string;
  district: string;
  ward: string;
  address: string;
  postalCode: string;
  logoUrl: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export declare interface MinimalBusiness {
  id: string;
  identifier: string;
  name: string;
  businessTypeId: string;
  businessTypeName: string;
  logoUrl: string | null;
  active: boolean;
  accountId: string;
  countryId: string;
}

export declare interface BusinessWithLocationType {
  business: Business;
  locations: Location[];
}
