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
  /** Set once the account is soft-deleted; drives the "Deleted" status badge. */
  deletedAt?: string | null;
}

export interface AccountOnboardingCounts {
  total: number;
  emailUnverified: number;
  businessIncomplete: number;
  locationIncomplete: number;
  complete: number;
}

export type StaffAssigneeType = "INTERNAL_STAFF" | "EXTERNAL_AGENT";

export interface AssignedStaffInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
  /** Sales person may be an internal staffer or an external agent; support is always internal. */
  type?: StaffAssigneeType;
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
  /** Projected from Auth via PHONE_VERIFIED; gates the change/verify-phone actions. */
  phoneVerified: boolean | null;
  onboardingState: OnboardingState | null;
  salesPerson: AssignedStaffInfo | null;
  supportStaff: AssignedStaffInfo | null;
  businessCount: number;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
  /** Set once soft-deleted; the detail page stays reachable so the account can be purged. */
  deletedAt?: string | null;
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
  /** true = only soft-deleted accounts (so they can be found and purged); omitted = only live accounts. */
  deleted?: boolean;
  onboardingState?: OnboardingState;
  createdFrom?: string;
  createdTo?: string;
}

export interface SearchCustomersParams extends PageParams {
  q: string;
}

/**
 * One merged customer identity in the global, de-duplicated list — the same
 * human collapsed across businesses/locations by phone (or email). Sourced
 * from the Reports Service (dim_customer GROUP BY). Read-only: to edit, drill
 * into an individual record via the "Find a record" search.
 */
export interface MergedCustomerRow {
  mergeKey: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  /** Distinct businesses this person appears under. */
  businessCount: number;
  /** Underlying per-location customer records collapsed into this identity. */
  recordCount: number;
  lastSeen: string | null;
}

export interface MergedCustomerPage {
  content: MergedCustomerRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ListMergedCustomersParams {
  search?: string;
  page?: number;
  size?: number;
}
