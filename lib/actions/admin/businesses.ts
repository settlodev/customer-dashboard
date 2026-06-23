"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import {
  AdminBusinessDetail,
  AdminBusinessPage,
  AdminLocationDetail,
  AdminLocationListItem,
  AdminStoreDetail,
  AdminStoreListItem,
  AdminWarehouseDetail,
  AdminWarehouseListItem,
  BusinessStatusCounts,
  ListBusinessesParams,
} from "@/types/admin/business";
import type { z } from "zod";
import type {
  UpdateBusinessSchema,
  UpdateLocationSchema,
  UpdateStoreSchema,
  UpdateWarehouseSchema,
} from "@/types/admin/schemas";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

function buildQuery(params: ListBusinessesParams): string {
  const qs = new URLSearchParams();
  if (params.accountId) qs.set("accountId", params.accountId);
  if (params.search) qs.set("search", params.search);
  if (typeof params.active === "boolean") qs.set("active", String(params.active));
  qs.set("page", String(Math.max(0, params.page ?? 0)));
  qs.set("size", String(params.size ?? 20));
  return qs.toString();
}

export async function listAdminBusinesses(
  params: ListBusinessesParams = {},
): Promise<AdminBusinessPage> {
  const data = await staffClient().get<AdminBusinessPage>(
    `/api/v1/admin/businesses?${buildQuery(params)}`,
  );
  return parseStringify(data);
}

/**
 * Active/inactive counts for the businesses list status tabs. There's no
 * dedicated counts endpoint, so we read `totalElements` off two size=1
 * queries (all + active) and derive inactive. Scoped by the same
 * search/accountId filters as the list so the tab counts match the table.
 */
export async function getBusinessStatusCounts(
  params: Pick<ListBusinessesParams, "accountId" | "search"> = {},
): Promise<BusinessStatusCounts> {
  const [all, activeOnly] = await Promise.all([
    listAdminBusinesses({ ...params, active: undefined, page: 0, size: 1 }),
    listAdminBusinesses({ ...params, active: true, page: 0, size: 1 }),
  ]);
  const total = all.totalElements ?? 0;
  const active = activeOnly.totalElements ?? 0;
  return { total, active, inactive: Math.max(0, total - active) };
}

export async function listAccountBusinesses(
  accountId: string,
  page = 0,
  size = 20,
): Promise<AdminBusinessPage> {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(0, page)));
  qs.set("size", String(size));
  const data = await staffClient().get<AdminBusinessPage>(
    `/api/v1/admin/accounts/${accountId}/businesses?${qs.toString()}`,
  );
  return parseStringify(data);
}

export async function getAdminBusinessDetail(
  businessId: string,
): Promise<AdminBusinessDetail> {
  const data = await staffClient().get<AdminBusinessDetail>(
    `/api/v1/admin/businesses/${businessId}`,
  );
  return parseStringify(data);
}

export async function listAdminBusinessLocations(
  businessId: string,
): Promise<AdminLocationListItem[]> {
  const data = await staffClient().get<AdminLocationListItem[]>(
    `/api/v1/admin/businesses/${businessId}/locations`,
  );
  return parseStringify(data);
}

export async function listAdminBusinessWarehouses(
  businessId: string,
): Promise<AdminWarehouseListItem[]> {
  const data = await staffClient().get<AdminWarehouseListItem[]>(
    `/api/v1/admin/businesses/${businessId}/warehouses`,
  );
  return parseStringify(data);
}

export async function listAdminBusinessStores(
  businessId: string,
): Promise<AdminStoreListItem[]> {
  const data = await staffClient().get<AdminStoreListItem[]>(
    `/api/v1/admin/businesses/${businessId}/stores`,
  );
  return parseStringify(data);
}

export async function getAdminLocationDetail(
  locationId: string,
): Promise<AdminLocationDetail> {
  const data = await staffClient().get<AdminLocationDetail>(
    `/api/v1/admin/locations/${locationId}`,
  );
  return parseStringify(data);
}

export async function getAdminWarehouseDetail(
  warehouseId: string,
): Promise<AdminWarehouseDetail> {
  const data = await staffClient().get<AdminWarehouseDetail>(
    `/api/v1/admin/warehouses/${warehouseId}`,
  );
  return parseStringify(data);
}

export async function getAdminStoreDetail(
  storeId: string,
): Promise<AdminStoreDetail> {
  const data = await staffClient().get<AdminStoreDetail>(
    `/api/v1/admin/stores/${storeId}`,
  );
  return parseStringify(data);
}

// ── Cross-tenant entity edits (internal staff) ──────────────────────

export async function updateAdminBusiness(
  businessId: string,
  values: z.infer<typeof UpdateBusinessSchema>,
): Promise<FormResponse<AdminBusinessDetail>> {
  try {
    const result = await staffClient().put<
      AdminBusinessDetail,
      z.infer<typeof UpdateBusinessSchema>
    >(`/api/v1/admin/businesses/${businessId}`, values);
    revalidatePath("/admin/businesses");
    revalidatePath(`/admin/businesses/${businessId}`);
    return parseStringify({
      responseType: "success",
      message: "Business updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update business",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAdminLocation(
  locationId: string,
  values: z.infer<typeof UpdateLocationSchema>,
): Promise<FormResponse<AdminLocationDetail>> {
  try {
    const result = await staffClient().put<
      AdminLocationDetail,
      z.infer<typeof UpdateLocationSchema>
    >(`/api/v1/admin/locations/${locationId}`, values);
    revalidatePath("/admin/locations");
    revalidatePath(`/admin/locations/${locationId}`);
    return parseStringify({
      responseType: "success",
      message: "Location updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update location",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAdminStore(
  storeId: string,
  values: z.infer<typeof UpdateStoreSchema>,
): Promise<FormResponse<AdminStoreDetail>> {
  try {
    const result = await staffClient().put<
      AdminStoreDetail,
      z.infer<typeof UpdateStoreSchema>
    >(`/api/v1/admin/stores/${storeId}`, values);
    revalidatePath(`/admin/stores/${storeId}`);
    return parseStringify({
      responseType: "success",
      message: "Store updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update store",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function updateAdminWarehouse(
  warehouseId: string,
  values: z.infer<typeof UpdateWarehouseSchema>,
): Promise<FormResponse<AdminWarehouseDetail>> {
  try {
    const result = await staffClient().put<
      AdminWarehouseDetail,
      z.infer<typeof UpdateWarehouseSchema>
    >(`/api/v1/admin/warehouses/${warehouseId}`, values);
    revalidatePath(`/admin/warehouses/${warehouseId}`);
    return parseStringify({
      responseType: "success",
      message: "Warehouse updated",
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to update warehouse",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
