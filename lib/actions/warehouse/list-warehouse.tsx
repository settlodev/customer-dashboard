"use server";

import { z } from "zod";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { getCurrentWarehouse } from "./current-warehouse-action";

// ── Queries ─────────────────────────────────────────────────────────

export async function getWarehouses(businessId?: string): Promise<Warehouses[]> {
  try {
    const apiClient = new ApiClient();
    const biz = businessId || (await getCurrentBusiness())?.id;
    const params = biz ? `?businessId=${biz}` : "";
    const data = await apiClient.get(`/api/v1/warehouses${params}`);
    return parseStringify(data) as Warehouses[];
  } catch {
    return [];
  }
}

export async function getWarehouse(id?: string): Promise<Warehouses | null> {
  try {
    const apiClient = new ApiClient();
    const warehouseId = id || (await getCurrentWarehouse())?.id;
    if (!warehouseId) return null;
    const data = await apiClient.get(`/api/v1/warehouses/${warehouseId}`);
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getPrimaryWarehouse(businessId: string): Promise<Warehouses | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/warehouses/primary?businessId=${businessId}`);
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function getWarehouseCount(businessId?: string): Promise<{ total: number; active: number; inactive: number }> {
  try {
    const apiClient = new ApiClient();
    const params = businessId ? `?businessId=${businessId}` : "";
    const data = await apiClient.get(`/api/v1/warehouses/count${params}`);
    return parseStringify(data);
  } catch {
    return { total: 0, active: 0, inactive: 0 };
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────

export async function createWarehouse(data: {
  name: string;
  description?: string;
  code?: string;
  primary?: boolean;
  capacity?: number;
}): Promise<FormResponse | void> {
  try {
    const business = await getCurrentBusiness();
    if (!business?.id) {
      return parseStringify({ responseType: "error", message: "No business selected" });
    }

    const apiClient = new ApiClient();
    await apiClient.post("/api/v1/warehouses", {
      businessId: business.id,
      ...data,
    });

    revalidatePath("/warehouses");
    return parseStringify({ responseType: "success", message: "Warehouse created successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create warehouse",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateWarehouse(
  id: string,
  data: {
    name?: string;
    description?: string;
    code?: string;
    primary?: boolean;
    capacity?: number;
    active?: boolean;
  },
): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/warehouses/${id}`, data);

    revalidatePath("/warehouses");
    return parseStringify({ responseType: "success", message: "Warehouse updated successfully" });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to update warehouse",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deleteWarehouse(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete(`/api/v1/warehouses/${id}`);
  revalidatePath("/warehouses");
}

export async function deactivateWarehouse(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/warehouses/${id}/deactivate`, {});
  revalidatePath("/warehouses");
}

export async function reactivateWarehouse(id: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(`/api/v1/warehouses/${id}/reactivate`, {});
  revalidatePath("/warehouses");
}

// ── Backward compat aliases ─────────────────────────────────────────

export async function searchWarehouses(): Promise<Warehouses[]> {
  return getWarehouses();
}
