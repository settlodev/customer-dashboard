"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { Brand } from "@/types/brand/type";
import { BrandSchema } from "@/types/brand/schema";
import { inventoryUrl } from "./inventory-client";

export async function fetchAllBrands(): Promise<Brand[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/brands?size=200"));
    const page = parseStringify(data) as ApiResponse<Brand>;
    return page.content;
  } catch (error) {
    throw error;
  }
}

export async function searchBrand(
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Brand>> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (q) params.set("name", q);
    params.set("page", String(page ? page - 1 : 0));
    params.set("size", String(pageLimit || 10));
    params.set("sortBy", "name");
    params.set("sortDirection", "ASC");

    const data = await apiClient.get(
      inventoryUrl(`/api/v1/brands?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
}

export async function createBrand(
  brand: z.infer<typeof BrandSchema>,
): Promise<FormResponse | void> {
  const validated = BrandSchema.safeParse(brand);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/brands"), {
      locationType: "LOCATION",
      name: validated.data.name,
      description: validated.data.description,
      imageUrl: validated.data.imageUrl,
    });

    revalidatePath("/brands");
    return parseStringify({
      responseType: "success",
      message: "Brand created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to create brand",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function getBrand(id: string): Promise<Brand> {
  const apiClient = new ApiClient();
  const data = await apiClient.get(inventoryUrl(`/api/v1/brands/${id}`));
  return parseStringify(data);
}

export async function updateBrand(
  id: string,
  brand: z.infer<typeof BrandSchema>,
): Promise<FormResponse | void> {
  const validated = BrandSchema.safeParse(brand);

  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.put(inventoryUrl(`/api/v1/brands/${id}`), validated.data);

    revalidatePath("/brands");
    return parseStringify({
      responseType: "success",
      message: "Brand updated successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update brand",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteBrand(id: string): Promise<void> {
  if (!id) throw new Error("Brand ID is required");

  const apiClient = new ApiClient();
  await apiClient.delete(inventoryUrl(`/api/v1/brands/${id}`));
  revalidatePath("/brands");
}

export async function archiveBrand(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/brands/${id}/archive`), {});
    revalidatePath("/brands");
    return { responseType: "success", message: "Brand archived" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to archive brand",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function unarchiveBrand(id: string): Promise<FormResponse> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/brands/${id}/unarchive`), {});
    revalidatePath("/brands");
    return { responseType: "success", message: "Brand restored" };
  } catch (error) {
    return {
      responseType: "error",
      message: "Failed to restore brand",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
