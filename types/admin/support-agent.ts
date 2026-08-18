import { ApiResponse } from "@/types/types";

export interface SupportAgentResponse {
  id: string;
  authId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string | null;
  active: boolean;
  notes: string | null;
  totalReferrals: number;
  activeReferrals: number;
  createdAt: string;
}

export interface CreateSupportAgentRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  notes?: string;
}

export type SupportAgentPage = ApiResponse<SupportAgentResponse>;
