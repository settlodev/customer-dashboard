"use server";

type UUID = string;

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { Staff, StaffSummaryReport } from "@/types/staff";
import { ApiResponse, FormResponse } from "@/types/types";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StaffSchema } from "@/types/staff";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import { inviteStaffToBusiness } from "./emails/send";

type invitedStaff = {
  passwordResetToken: string;
  staffEmail: string;
};

export const fetchAllStaff = async (): Promise<Staff[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const staffData = await apiClient.get(`/api/v1/staff?locationId=${location?.id}`);

    return parseStringify(staffData);
  } catch (error) {
    throw error;
  }
};

export const searchStaff = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Staff>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const query = {
      filters: [
        {
          key: "firstName",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
        // {
        //   key: "isArchived",
        //   operator: "EQUAL",
        //   field_type: "BOOLEAN",
        //   value: false,
        // },
      ],
      sorts: [
        {
          key: "firstName",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const location = await getCurrentLocation();

    const params = new URLSearchParams();
    if (q) params.append("search", q);
    params.append("page", String(page ? page - 1 : 0));
    params.append("size", String(pageLimit || 10));
    params.append("sort", "firstName,asc");
    if (location?.id) params.append("locationId", location.id);

    const staffData = await apiClient.get(`/api/v1/staff?${params.toString()}`);

    return parseStringify(staffData);
  } catch (error) {
    throw error;
  }
};

export const createStaff = async (
  staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validatedData = StaffSchema.safeParse(staff);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
      ...validatedData.data,
      location: location?.id,
      business: business?.id,
    };

    const staff = (await apiClient.post(
      `/api/v1/staff`,
      payload,
    )) as Staff;

    if (staff && staff.dashboardAccess === true) {
      const staffId = staff.id;
      const businessId = business?.id;

      if (staffId && businessId) {
        await inviteStaff(staffId, businessId);
      } else {
        return parseStringify({
          responseType: "error",
          message: "Staff created but invitation failed due to invalid IDs",
          error: new Error("Invalid staff or business id"),
        });
      }
    }

    formResponse = {
      responseType: "success",
      message: "Staff created successfully",
    };

    revalidatePath("/staff");
    // redirect("/staff");
  } catch (error: any) {
    // console.error("Error creating staff:", error);

    let errorMessage = "An unexpected error occurred. Please try again.";

    // Try to extract meaningful error messages
    if (error.message) {
      errorMessage = error.message;
    } else if (error.details?.message) {
      errorMessage = error.details.message;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }

    if (
      errorMessage.includes("beyond the limit") ||
      errorMessage.includes("subscription")
    ) {
      errorMessage = errorMessage;
    }

    return parseStringify({
      responseType: "error",
      message: errorMessage,
      error: new Error(errorMessage),
    });
  }

  return parseStringify(formResponse);
};

export const updateStaff = async (
  id: UUID,
  staff: z.infer<typeof StaffSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validatedData = StaffSchema.safeParse(staff);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
      ...validatedData.data,
      location: location?.id,
      business: business?.id,
    };

    await apiClient.put(`/api/v1/staff/${id}`, payload);
    formResponse = {
      responseType: "success",
      message: "Staff updated successfully",
    };
  } catch (error: unknown) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/staff");

  return parseStringify(formResponse);
};

export const getStaff = async (id: UUID): Promise<Staff> => {
  const apiClient = new ApiClient();

  const staffData = await apiClient.get(`/api/v1/staff/${id}`);

  return parseStringify(staffData);
};

export const deleteStaff = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Staff ID is required to perform this request");
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(`/api/v1/staff/${id}`);
    revalidatePath("/staff");
  } catch (error: any) {
    throw new Error(
      error.message ||
        error.details?.message ||
        "An unexpected error occurred. Please try again.",
    );
  }
};

export const deactivateStaff = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Staff ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${id}/deactivate`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "Staff deactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to deactivate staff",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateStaff = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Staff ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${id}/reactivate`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "Staff reactivated successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reactivate staff",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const grantDashboardAccess = async (
  staffId: UUID,
  email: string,
  password: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/dashboard-access`, { email, password });
    revalidatePath("/staff");
    return { responseType: "success", message: "Dashboard access granted" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to grant dashboard access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const revokeDashboardAccess = async (staffId: UUID): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/dashboard-access`);
    revalidatePath("/staff");
    return { responseType: "success", message: "Dashboard access revoked" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to revoke dashboard access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const grantPosAccess = async (staffId: UUID): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/pos-access`, {});
    revalidatePath("/staff");
    return { responseType: "success", message: "POS access granted" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to grant POS access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const revokePosAccess = async (staffId: UUID): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/staff/${staffId}/pos-access`);
    revalidatePath("/staff");
    return { responseType: "success", message: "POS access revoked" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to revoke POS access",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const assignStaffRoles = async (
  staffId: UUID,
  roleIds: string[],
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/staff/${staffId}/roles`, { roleIds });
    revalidatePath("/staff");
    return { responseType: "success", message: "Roles assigned successfully" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to assign roles",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getStaffCount = async (): Promise<{ total: number; active: number; inactive: number }> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/staff/count`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

const inviteStaff = async (staffId: UUID, businessId: UUID): Promise<void> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const payload = {
      staff: staffId,
      business: businessId,
    };

    const invitedStaff: invitedStaff = await apiClient.post(
      `/api/v1/staff/${staffId}/dashboard-access`,
      payload,
    );
    //    console.log("The invited staff is", invitedStaff);
    const token = invitedStaff.passwordResetToken;
    const email = invitedStaff.staffEmail;
    if (token && email) {
      await inviteStaffToBusiness(token, email);
    }
    revalidatePath("/staff");
  } catch (error: any) {
    throw new Error(
      error.message ||
        error.details?.message ||
        "An unexpected error occurred. Please try again.",
    );
  }
};

export const staffReport = async (
  startDate?: Date,
  endDate?: Date,
): Promise<StaffSummaryReport | null> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = {
      startDate,
      endDate,
    };
    const report = await apiClient.get(
      `/api/reports/${location?.id}/staff/summary`,
      {
        params,
      },
    );

    console.log("staff report is as follows", report);

    return parseStringify(report);
  } catch (error: any) {
    // console.error("Error fetching staff summary report:", error);
    throw new Error(
      error.message ||
        error.details?.message ||
        "An unexpected error occurred. Please try again.",
    );
  }
};

export const resetStaffPasscode = async (staffId: UUID): Promise<void> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.patch(
      `/api/v1/staff/${staffId}/pin`,
      {},
    );
    revalidatePath("/staff");
  } catch (error: any) {
    throw new Error(
      error.message ||
        error.details?.message ||
        "An unexpected error occurred. Please try again.",
    );
  }
};
