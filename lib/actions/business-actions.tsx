"use server";

type UUID = string;

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { ApiResponse, FormResponse } from "@/types/types";
import { Business } from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";

export const fetchBusinessType = async () => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;

    const response = await apiClient.get("/api/v1/public/business-types");

    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

export const fetchAllBusinesses = async (): Promise<Business[] | null> => {
  try {
    const apiClient = new ApiClient();

    const data = await apiClient.get(`/api/v1/businesses`);

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchBusiness = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Business>> => {
  try {
    const apiClient = new ApiClient();

    const params = new URLSearchParams();
    if (q) params.append("search", q);
    params.append("page", String(page ? page - 1 : 0));
    params.append("size", String(pageLimit || 10));
    params.append("sort", "name,asc");

    const data = await apiClient.get(`/api/v1/businesses?${params.toString()}`);

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createBusiness = async (
  business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validatedData = BusinessSchema.safeParse(business);

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

    const response = await apiClient.post(
      `/api/v1/businesses`,
      validatedData.data,
    );

    return {
      responseType: "success",
      message: "Business created successfully",
      data: response,
    };
  } catch (error: unknown) {
    console.error("Error creating business:", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse && formResponse.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/business");
  redirect("/business");
};

export const updateBusiness = async (
  id: UUID,
  business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const apiClient = new ApiClient();

  const validatedData = BusinessSchema.safeParse(business);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    await apiClient.put(`/api/v1/businesses/${id}`, validatedData.data);

    formResponse = {
      responseType: "success",
      message: "Business updated successfully",
    };
  } catch (error: unknown) {
    const formattedError = error as Record<string, unknown> & {
      message?: string;
      details?: { fieldErrors?: unknown };
    };
    console.error("Error updating business - Full Details:", {
      ...formattedError,
      details: {
        ...formattedError.details,
        fieldErrors: JSON.stringify(formattedError.details?.fieldErrors, null, 2),
      },
    });

    formResponse = {
      responseType: "error",
      message:
        formattedError.message ??
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/business");
  redirect("/business");
};

export const getSingleBusiness = async (id: UUID): Promise<Business> => {
  const apiClient = new ApiClient();

  const data = await apiClient.get(`/api/v1/businesses/${id}`);
  return parseStringify(data);
};

export const deleteBusiness = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Business ID is required to perform this request");
  await getAuthenticatedUser();
  try {
    const apiClient = new ApiClient();

    await apiClient.delete(`/api/v1/businesses/${id}`);

    revalidatePath("/business");
  } catch (error) {
    throw error;
  }
};

export const deactivateBusiness = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Business ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/businesses/${id}/deactivate`, {});
    revalidatePath("/business");
    return {
      responseType: "success",
      message: "Business deactivated successfully",
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to deactivate business",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const reactivateBusiness = async (id: UUID): Promise<FormResponse> => {
  if (!id) throw new Error("Business ID is required");
  try {
    const apiClient = new ApiClient();
    await apiClient.post(`/api/v1/businesses/${id}/reactivate`, {});
    revalidatePath("/business");
    return {
      responseType: "success",
      message: "Business reactivated successfully",
    };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to reactivate business",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

export const getBusinessCount = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
}> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/businesses/count`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
