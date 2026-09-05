import { ApiResponse } from "@/types/types";

/** Mirrors the Accounts Service's AdminVfdRegistrationListResponse. */
export interface AdminVfdRegistrationListItem {
  firstName: string;
  lastName: string;
  accountEmail: string;
  phoneNumber: string | null;
  businessName: string;
  locationName: string;
  externalStatus: string | null;
  externalStatusMessage: string | null;
  taxOffice: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminVfdRegistrationPage = ApiResponse<AdminVfdRegistrationListItem>;

export interface ListVfdRegistrationsParams {
  page?: number;
  size?: number;
  /** Raw externalStatus value ("Pending" | "Active"); omitted returns all. */
  status?: string;
}

export interface VfdRegistrationStatusCounts {
  total: number;
  pending: number;
  active: number;
}
