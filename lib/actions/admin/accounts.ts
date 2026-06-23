"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  AccountOnboardingCounts,
  AccountStatusUpdateRequest,
  AdminAccountDetail,
  AdminAccountListPage,
  AdminCustomerSearchItem,
  AdminCustomerSearchPage,
  AssignedStaffInfo,
  ListAccountsParams,
  PlatformStatsResponse,
  SearchCustomersParams,
} from "@/types/admin/account";
import type {
  AssignStaffRequest,
  InternalStaffSummary,
} from "@/types/admin/internal-staff";
import type { z } from "zod";
import type {
  UpdateAccountSchema,
  UpdateCustomerSchema,
} from "@/types/admin/schemas";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

function buildFilterQuery(params: ListAccountsParams): URLSearchParams {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (typeof params.active === "boolean") qs.set("active", String(params.active));
  if (params.onboardingState) qs.set("onboardingState", params.onboardingState);
  if (params.createdFrom) qs.set("createdFrom", params.createdFrom);
  if (params.createdTo) qs.set("createdTo", params.createdTo);
  return qs;
}

function buildPageQuery(params: ListAccountsParams): string {
  const qs = buildFilterQuery(params);
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  if (params.sort) qs.set("sort", params.sort);
  return qs.toString();
}

export async function listAccounts(
  params: ListAccountsParams = {},
): Promise<AdminAccountListPage> {
  const qs = buildPageQuery(params);
  const data = await staffClient().get<AdminAccountListPage>(
    `/api/v1/admin/accounts?${qs}`,
  );
  return parseStringify(data);
}

export async function getAccountOnboardingCounts(
  params: Omit<ListAccountsParams, "page" | "size" | "sort" | "onboardingState"> = {},
): Promise<AccountOnboardingCounts> {
  const qs = buildFilterQuery({ ...params, onboardingState: undefined });
  const queryString = qs.toString();
  const data = await staffClient().get<AccountOnboardingCounts>(
    queryString.length > 0
      ? `/api/v1/admin/accounts/onboarding-counts?${queryString}`
      : `/api/v1/admin/accounts/onboarding-counts`,
  );
  return parseStringify(data);
}

export async function getAccountDetail(
  accountId: string,
): Promise<AdminAccountDetail> {
  const data = await staffClient().get<AdminAccountDetail>(
    `/api/v1/admin/accounts/${accountId}`,
  );
  return parseStringify(data);
}

export async function suspendAccount(
  accountId: string,
  reason?: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const body: AccountStatusUpdateRequest = reason ? { reason } : {};
    const result = await staffClient().post<
      { message: string },
      AccountStatusUpdateRequest
    >(`/api/v1/admin/accounts/${accountId}/suspend`, body);

    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Account suspended",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to suspend account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function reactivateAccount(
  accountId: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<
      { message: string },
      Record<string, never>
    >(`/api/v1/admin/accounts/${accountId}/reactivate`, {});

    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Account reactivated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to reactivate account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function setAccountInternal(
  accountId: string,
  internal: boolean,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().patch<
      { message: string },
      { internal: boolean }
    >(`/api/v1/admin/accounts/${accountId}/internal`, { internal });

    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message:
        result?.message ??
        (internal ? "Account marked as internal" : "Account marked as customer"),
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update internal flag",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function resendVerificationEmail(
  accountId: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<
      { message: string },
      Record<string, never>
    >(`/api/v1/admin/accounts/${accountId}/resend-verification-email`, {});

    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Verification email sent",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to send verification email",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function republishAccountEvents(
  accountId: string,
): Promise<
  FormResponse<{
    accountId: string;
    accountEventEmitted: boolean;
    identityRepublished: boolean;
  }>
> {
  try {
    const result = await staffClient().post<
      {
        accountId: string;
        accountEventEmitted: boolean;
        identityRepublished: boolean;
      },
      Record<string, never>
    >(`/api/v1/admin/accounts/${accountId}/republish`, {});

    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.identityRepublished
        ? "Republished account and identity events"
        : "Republished account events",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to republish account events",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteAccount(
  accountId: string,
): Promise<FormResponse<void>> {
  try {
    await staffClient().delete<void>(`/api/v1/admin/accounts/${accountId}`);
    revalidatePath("/admin/accounts");
    return parseStringify({
      responseType: "success",
      message: "Account deleted",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to delete account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Hard-purge (permanently, irreversibly delete) a FRESH account — one that never
 * created a business. The backend returns 409 if the account owns any
 * operational unit; in that case fall back to soft-delete.
 */
export async function purgeAccount(
  accountId: string,
): Promise<FormResponse<void>> {
  try {
    await staffClient().delete<void>(`/api/v1/admin/accounts/${accountId}/purge`);
    revalidatePath("/admin/accounts");
    return parseStringify({
      responseType: "success",
      message: "Account permanently purged",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message:
        error?.message ||
        "Failed to purge account — it may have data; use soft-delete instead.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function searchCustomers(
  params: SearchCustomersParams,
): Promise<AdminCustomerSearchPage> {
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  if (params.sort) qs.set("sort", params.sort);

  const data = await staffClient().get<AdminCustomerSearchPage>(
    `/api/v1/admin/customers/search?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getPlatformStats(): Promise<PlatformStatsResponse> {
  const data = await staffClient().get<PlatformStatsResponse>(
    "/api/v1/admin/stats",
  );
  return parseStringify(data);
}

// ── Staff assignment ────────────────────────────────────────────────

export async function listActiveInternalStaff(): Promise<InternalStaffSummary[]> {
  const data = await staffClient().get<InternalStaffSummary[]>(
    "/api/v1/admin/internal-staff",
  );
  return parseStringify(data);
}

async function patchStaffAssignment(
  accountId: string,
  segment: "sales-person" | "support-staff",
  staffId: string,
): Promise<FormResponse<AssignedStaffInfo>> {
  try {
    const body: AssignStaffRequest = { staffId };
    const result = await staffClient().patch<
      AssignedStaffInfo,
      AssignStaffRequest
    >(`/api/v1/admin/accounts/${accountId}/${segment}`, body);
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: segment === "sales-person"
        ? "Sales person assigned"
        : "Support staff assigned",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to assign staff",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

async function deleteStaffAssignment(
  accountId: string,
  segment: "sales-person" | "support-staff",
): Promise<FormResponse<void>> {
  try {
    await staffClient().delete<void>(
      `/api/v1/admin/accounts/${accountId}/${segment}`,
    );
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: segment === "sales-person"
        ? "Sales person removed"
        : "Support staff removed",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to remove assignment",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function assignSalesPerson(
  accountId: string,
  staffId: string,
): Promise<FormResponse<AssignedStaffInfo>> {
  return patchStaffAssignment(accountId, "sales-person", staffId);
}

export async function assignSupportStaff(
  accountId: string,
  staffId: string,
): Promise<FormResponse<AssignedStaffInfo>> {
  return patchStaffAssignment(accountId, "support-staff", staffId);
}

export async function unassignSalesPerson(
  accountId: string,
): Promise<FormResponse<void>> {
  return deleteStaffAssignment(accountId, "sales-person");
}

export async function unassignSupportStaff(
  accountId: string,
): Promise<FormResponse<void>> {
  return deleteStaffAssignment(accountId, "support-staff");
}

export async function sendAccountEmail(
  accountId: string,
  subject: string,
  body: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().post<{ message: string }, { subject: string; body: string }>(
      `/api/v1/admin/accounts/${accountId}/send-email`,
      { subject, body },
    );
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Email queued",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to send email",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

// ── Cross-tenant edits (internal staff) ─────────────────────────────

/**
 * Update an account owner's profile fields. Email/phone are NOT updated here —
 * use changeAccountEmail/changeAccountPhone (fresh unverified accounts only).
 */
export async function updateAccountProfile(
  accountId: string,
  values: z.infer<typeof UpdateAccountSchema>,
): Promise<FormResponse<AdminAccountDetail>> {
  try {
    const result = await staffClient().patch<
      AdminAccountDetail,
      z.infer<typeof UpdateAccountSchema>
    >(`/api/v1/admin/accounts/${accountId}/profile`, values);
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: "Account details updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update account",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Change a FRESH, UNVERIFIED account owner's email and re-send verification.
 * The backend (Auth) rejects this if the account is already verified.
 */
export async function changeAccountEmail(
  accountId: string,
  email: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().patch<
      { message: string },
      { email: string }
    >(`/api/v1/admin/accounts/${accountId}/email`, { email });
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Email updated; verification sent",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to change email",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Change a FRESH, UNVERIFIED account owner's phone and re-send verification.
 */
export async function changeAccountPhone(
  accountId: string,
  phoneNumber: string,
  region?: string,
): Promise<FormResponse<{ message: string }>> {
  try {
    const result = await staffClient().patch<
      { message: string },
      { phoneNumber: string; region?: string }
    >(`/api/v1/admin/accounts/${accountId}/phone`, {
      phoneNumber,
      ...(region ? { region } : {}),
    });
    revalidatePath("/admin/accounts");
    revalidatePath(`/admin/accounts/${accountId}`);
    return parseStringify({
      responseType: "success",
      message: result?.message ?? "Phone updated; verification sent",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to change phone",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Update a single (per-location) customer record. The merged customers list is
 * read-only — edits target the underlying record by id.
 */
export async function updateAdminCustomer(
  customerId: string,
  values: z.infer<typeof UpdateCustomerSchema>,
): Promise<FormResponse<AdminCustomerSearchItem>> {
  try {
    const result = await staffClient().put<
      AdminCustomerSearchItem,
      z.infer<typeof UpdateCustomerSchema>
    >(`/api/v1/admin/customers/${customerId}`, values);
    revalidatePath("/admin/customers");
    return parseStringify({
      responseType: "success",
      message: "Customer updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update customer",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
