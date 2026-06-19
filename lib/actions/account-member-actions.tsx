"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

export interface AccountMember {
  id: string;
  slug: string;
  authId?: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  invitedAt: string;
  acceptedAt?: string;
  pending: boolean;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    scope: string;
  }>;
  scopes: Array<{
    scopeType: string;
    scopeId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const listMembers = async (): Promise<AccountMember[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/account-members`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getMember = async (memberId: string): Promise<AccountMember> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/account-members/${memberId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const inviteMember = async (data: {
  email: string;
  firstName: string;
  lastName?: string;
  roleIds: string[];
  scopes?: Array<{ scopeType: string; scopeId: string }>;
}): Promise<FormResponse<AccountMember>> => {
  try {
    let scopes = data.scopes;
    if (!scopes || scopes.length === 0) {
      try {
        const cookieStore = await cookies();
        const raw = cookieStore.get("currentLocation")?.value;
        const loc = raw ? JSON.parse(raw) : null;
        if (loc?.id) {
          scopes = [{ scopeType: "LOCATION", scopeId: loc.id }];
        }
      } catch {
        // no current location → leave scopes undefined (Accounts defaults to ACCOUNT)
      }
    }
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/account-members/invite`, { ...data, scopes });
    revalidatePath("/team");
    return { responseType: "success", message: "Invitation sent successfully", data: parseStringify(response) };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to send invitation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateMemberRoles = async (
  memberId: string,
  roleIds: string[],
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/account-members/${memberId}/roles`, { roleIds });
    revalidatePath("/team");
    return { responseType: "success", message: "Member roles updated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update member roles",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const updateMemberScopes = async (
  memberId: string,
  scopes: Array<{ scopeType: string; scopeId: string }>,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/account-members/${memberId}/scopes`, { scopes });
    revalidatePath("/team");
    return { responseType: "success", message: "Member scopes updated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to update member scopes",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const resendInvitation = async (memberId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/account-members/${memberId}/resend-invitation`, {});
    return { responseType: "success", message: "Invitation resent" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to resend invitation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const removeMember = async (memberId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/account-members/${memberId}`);
    revalidatePath("/team");
    return { responseType: "success", message: "Member removed" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to remove member",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const acceptInvitation = async (memberId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/account-members/${memberId}/accept`, {});
    return { responseType: "success", message: "Invitation accepted" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to accept invitation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export interface PublicInvitation {
  email: string;
  invitedToName: string;
  accountName: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  hasAccount: boolean;
}

export const getPublicInvitation = async (
  memberId: string,
): Promise<PublicInvitation | null> => {
  try {
    const base = process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL;
    if (!base) {
      console.warn("getPublicInvitation: ACCOUNTS_SERVICE_URL/SERVICE_URL not configured");
      return null;
    }
    const res = await fetch(
      `${base}/api/v1/public/account-members/invitations/${memberId}`,
      { headers: { "Content-Type": "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicInvitation;
  } catch {
    return null;
  }
};

export const declineInvitation = async (memberId: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/account-members/${memberId}/decline`, {});
    return { responseType: "success", message: "Invitation declined" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to decline invitation",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};
