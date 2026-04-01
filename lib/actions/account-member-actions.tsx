"use server";

import { revalidatePath } from "next/cache";
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
    const apiClient = new ApiClient();
    const response = await apiClient.post(`/api/v1/account-members/invite`, data);
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
