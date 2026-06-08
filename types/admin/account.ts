import { ApiResponse } from "@/types/types";

export type OnboardingState =
  | "EMAIL_UNVERIFIED"
  | "BUSINESS_INCOMPLETE"
  | "LOCATION_INCOMPLETE"
  | "COMPLETE";

export interface AdminAccountListItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  accountNumber: string;
  active: boolean;
  /** Internal (test/demo/employee) account — excluded from SaaS metrics. */
  internal: boolean;
  slug: string;
  whitelabelAppId: string | null;
  whitelabelAppCode: string | null;
  isBusinessRegistrationComplete: boolean | null;
  isLocationRegistrationComplete: boolean | null;
  emailVerified: boolean | null;
  onboardingState: OnboardingState | null;
  assignedSalesStaffId: string | null;
  assignedSupportStaffId: string | null;
  createdAt: string;
}

export interface AccountOnboardingCounts {
  total: number;
  emailUnverified: number;
  businessIncomplete: number;
  locationIncomplete: number;
  complete: number;
}

export interface AssignedStaffInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AdminAccountDetail {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountNumber: string;
  identifier: string | null;
  active: boolean;
  /** Internal (test/demo/employee) account — excluded from SaaS metrics. */
  internal: boolean;
  slug: string;
  bio: string | null;
  pictureUrl: string | null;
  region: string | null;
  district: string | null;
  ward: string | null;
  areaCode: string | null;
  countryId: string | null;
  countryCode: string | null;
  countryName: string | null;
  whitelabelAppId: string | null;
  whitelabelAppCode: string | null;
  authId: string;
  isBusinessRegistrationComplete: boolean | null;
  isLocationRegistrationComplete: boolean | null;
  emailVerified: boolean | null;
  onboardingState: OnboardingState | null;
  salesPerson: AssignedStaffInfo | null;
  supportStaff: AssignedStaffInfo | null;
  businessCount: number;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountStatusUpdateRequest {
  reason?: string;
}

export interface AdminCustomerSearchItem {
  id: string;
  accountId: string;
  businessId: string;
  locationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  customerAccountNumber: string;
  active: boolean;
  createdAt: string;
}

export interface PlatformStatsResponse {
  totalAccounts: number;
  activeAccounts: number;
  totalBusinesses: number;
  totalStaff: number;
  activeStaff: number;
  generatedAt: string;
}

export type AdminAccountListPage = ApiResponse<AdminAccountListItem>;
export type AdminCustomerSearchPage = ApiResponse<AdminCustomerSearchItem>;

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface ListAccountsParams extends PageParams {
  search?: string;
  active?: boolean;
  onboardingState?: OnboardingState;
  createdFrom?: string;
  createdTo?: string;
}

export interface SearchCustomersParams extends PageParams {
  q: string;
}
