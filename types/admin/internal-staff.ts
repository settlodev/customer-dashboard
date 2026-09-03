import { RoleSummary } from "@/types/admin/internal-user";

export interface InternalStaffSummary {
  id: string;
  authUserId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Every role (system or custom) this staff member currently holds. */
  roles: RoleSummary[];
  /** Whether ANY held role grants SALES assignment capability. */
  assignableAsSales: boolean;
  /** Whether ANY held role grants SUPPORT assignment capability. */
  assignableAsSupport: boolean;
  referralCode: string | null;
  active: boolean;
  phoneNumber: string | null;
  jobTitle: string | null;
  joiningDate: string | null;
  notes: string | null;
  totalReferrals: number;
  activeReferrals: number;
  createdAt: string;
}

export interface AssignStaffRequest {
  staffId: string;
  /** Sales only: INTERNAL_STAFF (default) or EXTERNAL_AGENT (influencer). */
  assigneeType?: "INTERNAL_STAFF" | "EXTERNAL_AGENT";
}

/** Edit an internal staff member's name + HRM-seed details (Accounts Service). */
export interface UpdateInternalStaffRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  jobTitle?: string;
  joiningDate?: string;
  notes?: string;
}
