"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type { Vendor } from "@/types/vendor/type";
import { VendorSchema } from "@/types/vendor/schema";

import { accountingUrl } from "./accounting-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";

export async function listVendors(
  search?: string,
  page = 0,
  size = 20,
): Promise<ApiResponse<Vendor>> {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/vendors?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listVendors failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<Vendor>;
  }
}

export async function fetchAllVendors(): Promise<Vendor[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/vendors/all`));
    return (parseStringify(data) as Vendor[]) ?? [];
  } catch {
    return [];
  }
}

export async function getVendor(id: string): Promise<Vendor | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(accountingUrl(`/api/v1/vendors/${id}`));
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function createVendor(
  values: z.infer<typeof VendorSchema>,
): Promise<FormResponse<Vendor>> {
  const parsed = VendorSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/vendors"),
      sanitize(parsed.data),
    )) as Vendor;
    revalidatePath("/vendors");
    return {
      responseType: "success",
      message: "Vendor created",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to create vendor");
  }
}

export async function updateVendor(
  id: string,
  values: z.infer<typeof VendorSchema>,
): Promise<FormResponse<Vendor>> {
  const parsed = VendorSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.put(
      accountingUrl(`/api/v1/vendors/${id}`),
      sanitize(parsed.data),
    )) as Vendor;
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return {
      responseType: "success",
      message: "Vendor updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update vendor");
  }
}

export async function deleteVendor(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(accountingUrl(`/api/v1/vendors/${id}`));
    revalidatePath("/vendors");
    return { responseType: "success", message: "Vendor deleted" };
  } catch (error: unknown) {
    return errResp(error, "Failed to delete vendor");
  }
}

export async function toggleVendorActive(id: string): Promise<FormResponse<Vendor>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.patch(
      accountingUrl(`/api/v1/vendors/${id}/toggle-active`),
      {},
    )) as Vendor;
    revalidatePath("/vendors");
    return {
      responseType: "success",
      message: "Vendor status updated",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    return errResp(error, "Failed to update vendor");
  }
}

function sanitize(values: z.infer<typeof VendorSchema>) {
  return {
    ...values,
    contactPerson: values.contactPerson || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    address: values.address || undefined,
    taxNumber: values.taxNumber || undefined,
    registrationNumber: values.registrationNumber || undefined,
    defaultCurrencyCode: values.defaultCurrencyCode || undefined,
    supplierId: values.supplierId || undefined,
    notes: values.notes || undefined,
  };
}

function errResp(error: unknown, fallback: string): FormResponse<Vendor> {
  console.error(fallback, error);
  return {
    responseType: "error",
    message: error instanceof Error ? error.message : fallback,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
