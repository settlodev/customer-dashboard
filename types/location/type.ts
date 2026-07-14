import { UUID } from "crypto";
import { subscriptionStatus } from "../enums";

export interface Location {
  type: any;
  id: UUID;
  name: string;
  phone: string;
  locationAccountNumber: string;
  email: string;
  city: string;
  region: string;
  street: string;
  address: string;
  description: string;
  image: string;
  openingTime: string;
  closingTime: string;
  status: boolean;
  isArchived: boolean;
  canDelete: boolean;
  dateCreated: string;
  settings: UUID;
  business: UUID;
  businessName: string;
  locationBusinessType: UUID;
  locationBusinessTypeName: string;
  subscriptionStatus: subscriptionStatus;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
}
