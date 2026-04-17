"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import {
  Department,
  DepartmentCount,
  DepartmentReport,
} from "@/types/department/type";
import { DepartmentSchema } from "@/types/department/schema";

// ---------------------------------------------------------------------------
// List / Search
// ---------------------------------------------------------------------------

export const fetchAllDepartments = async (): Promise<Department[]> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/departments/list`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchDepartment = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Department>> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      search: q,
      page: String(page ? page - 1 : 0),
      size: String(pageLimit || 10),
    });
    const data = await apiClient.get(
      `/api/v1/departments?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchDepartmentByName = async (
  query: string,
): Promise<Department[]> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      `/api/v1/departments/search?query=${encodeURIComponent(query)}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getDepartmentList = async (
  activeOnly?: boolean,
  ordered?: boolean,
): Promise<Department[]> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (activeOnly !== undefined)
      params.append("activeOnly", String(activeOnly));
    if (ordered !== undefined) params.append("ordered", String(ordered));
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get(`/api/v1/departments/list${query}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

export const getDepartment = async (id: string): Promise<Department> => {
  const apiClient = new ApiClient();
  const data = await apiClient.get(`/api/v1/departments/${id}`);
  return parseStringify(data);
};

// ---------------------------------------------------------------------------
// Count
// ---------------------------------------------------------------------------

export const getDepartmentCount = async (): Promise<DepartmentCount> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/departments/count`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createDepartment = async (
  department: z.infer<typeof DepartmentSchema>,
): Promise<FormResponse<Department>> => {
  const validatedData = DepartmentSchema.safeParse(department);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      `/api/v1/departments`,
      validatedData.data,
    );
    revalidatePath("/departments");
    console.log("The departments created is", response);
    return parseStringify({
      responseType: "success",
      message: "Department created successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create department",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateDepartment = async (
  id: string,
  department: z.infer<typeof DepartmentSchema>,
): Promise<FormResponse | void> => {
  const validatedData = DepartmentSchema.safeParse(department);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/departments/${id}`, validatedData.data);
    revalidatePath("/departments");
    return parseStringify({
      responseType: "success",
      message: "Department updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update department",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export const deleteDepartment = async (id: string): Promise<void> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(`/api/v1/departments/${id}`);
    revalidatePath("/departments");
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Deactivate / Reactivate
// ---------------------------------------------------------------------------

export const deactivateDepartment = async (
  id: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/departments/${id}/deactivate`, {});
    revalidatePath("/departments");
    return { responseType: "success", message: "Department deactivated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to deactivate department",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateDepartment = async (
  id: string,
): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/departments/${id}/reactivate`, {});
    revalidatePath("/departments");
    return { responseType: "success", message: "Department reactivated" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reactivate department",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const departmentReport = async (
  id: string,
  startDate?: string,
  endDate?: string,
): Promise<DepartmentReport> => {
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiClient.get(
      `/api/reports/${id}/department/summary${query}`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
