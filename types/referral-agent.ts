/**
 * Self-service view of an external referral agent's own referral standing,
 * returned by Accounts `GET /api/v1/referral-agent/me`. Mirrors the backend
 * `ReferralAgentSelfResponse` record.
 */
export interface ReferralAgentSelfResponse {
  fullName: string;
  email: string;
  referralCode: string | null;
  active: boolean;
  totalReferrals: number;
  activeReferrals: number;
}
