"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "./business/get-current-business";
import { Department, Report } from "@/types/department/type";
import { DepartmentSchema } from "@/types/department/schema";

export const fectchAllDepartments = async (): Promise<Department[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const departmentData = await apiClient.get(`/api/v1/departments`);

    return parseStringify(departmentData);
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
      size: String(pageLimit ? pageLimit : 10),
    });

    const departmentData = await apiClient.get(
      `/api/v1/departments?${params.toString()}`,
    );
    return parseStringify(departmentData);
  } catch (error) {
    throw error;
  }
};

export const createDepartment = async (
  department: z.infer<typeof DepartmentSchema>,
  path: string,
): Promise<FormResponse<Department>> => {
  // Authenticate user
  const authenticatedUser = await getAuthenticatedUser();
  if ("responseType" in authenticatedUser) {
    return parseStringify(authenticatedUser);
  }

  // Validate input data
  const validatedData = DepartmentSchema.safeParse(department);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the required fields",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    // Prepare payload with location and business
    const payload = {
      ...validatedData.data,
      location: location?.id,
      business: business?.id,
    };

    // Make API request
    const response = await apiClient.post(
      `/api/v1/departments`,
      payload,
    );

    // Handle path revalidation
    revalidatePath(path);

    // if (path === "department") {
    //     redirect("/departments");
    // }

    // Return success response with created department data
    return parseStringify({
      responseType: "success",
      message: "Department created successfully",
      data: parseStringify(response),
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message:
        error.message ?? "Failed to create department. Please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const getDepartment = async (
  id: UUID,
): Promise<ApiResponse<Department>> => {
  const apiClient = new ApiClient();

  const departmentResponse = await apiClient.get(`/api/v1/departments/${id}`);

  return parseStringify(departmentResponse);
};

export const updateDepartment = async (
  id: UUID,
  department: z.infer<typeof DepartmentSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const departmentValidData = DepartmentSchema.safeParse(department);

  if (!departmentValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(departmentValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const business = await getCurrentBusiness();

  const payload = {
    ...departmentValidData.data,
    location: location?.id,
    business: business?.id,
  };

  try {
    const apiClient = new ApiClient();

    await apiClient.put(`/api/v1/departments/${id}`, payload);

    revalidatePath("/departments");
    formResponse = {
      responseType: "success",
      message: "Department updated successfully",
    };
    return parseStringify(formResponse);
  } catch (error) {
    console.error("Error updating department", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse) {
    return parseStringify(formResponse);
  }
};

export const deleteDepartment = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Department ID is required to perform this request");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    await apiClient.delete(`/api/v1/departments/${id}`);
    revalidatePath("/departments");
  } catch (error) {
    throw error;
  }
};

export const DepartmentReport = async (
  id: UUID,
  startDate?: string,
  endDate?: string,
): Promise<Report> => {
  if (!id) throw new Error("Department ID is required to perform this request");

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const queryParams = new URLSearchParams();

    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const queryString = queryParams.toString();
    const url = `/api/reports/${id}/department/summary${queryString ? `?${queryString}` : ""}`;

    const report = await apiClient.get(url);

    return parseStringify(report);
  } catch (error) {
    throw error;
  }
};

export const fetchDepartmentsByLocation = async (
  locationId: string,
): Promise<Department[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const departmentData = await apiClient.get(`/api/v1/departments`);

    return parseStringify(departmentData);
  } catch (error) {
    console.error("Error fetching departments by location:", error);
    throw error;
  }
};

export const deactivateDepartment = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/departments/${id}/deactivate`, {});
    revalidatePath("/departments");
    return { responseType: "success", message: "Department deactivated successfully" };
  } catch (error) {
    return { responseType: "error", message: "Failed to deactivate department", error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const reactivateDepartment = async (id: string): Promise<FormResponse> => {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/departments/${id}/reactivate`, {});
    revalidatePath("/departments");
    return { responseType: "success", message: "Department reactivated successfully" };
  } catch (error) {
    return { responseType: "error", message: "Failed to reactivate department", error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const getDepartmentCount = async (): Promise<any> => {
  try {
    const apiClient = new ApiClient();
    const count = await apiClient.get(`/api/v1/departments/count`);
    return parseStringify(count);
  } catch (error) {
    throw error;
  }
};
