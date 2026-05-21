export interface InternalStaffSummary {
  id: string;
  authUserId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  internalRole: string;
  referralCode: string | null;
  active: boolean;
  totalReferrals: number;
  activeReferrals: number;
  createdAt: string;
}

export interface AssignStaffRequest {
  staffId: string;
}
