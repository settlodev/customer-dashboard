export interface InternalStaffSummary {
  id: string;
  authUserId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  internalRole: string;
  /** SALES | SUPPORT | null — assignment capability mirrored from the role. */
  assignableAs: string | null;
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
