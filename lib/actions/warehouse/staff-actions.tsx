"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { Staff } from "@/types/staff";
import { getCurrentWarehouse } from "./current-warehouse-action";

/**
 * Warehouse staff actions.
 * Staff are managed via the same Accounts Service staff endpoints,
 * scoped to warehouse via warehouseId query param.
 */

export async function searchWarehouseStaff(
  q: string = "",
  page: number = 0,
  pageLimit: number = 20,
): Promise<ApiResponse<Staff>> {
  try {
    const apiClient = new ApiClient();
    const warehouse = await getCurrentWarehouse();
    if (!warehouse?.id) {
      return { content: [], totalPages: 0, totalElements: 0 } as unknown as ApiResponse<Staff>;
    }

    const params = new URLSearchParams();
    if (q) params.set("search", q);
    params.set("page", String(page));
    params.set("size", String(pageLimit));

    const data = await apiClient.get(
      `/api/v1/staff?warehouseId=${warehouse.id}&${params.toString()}`,
    );
    return parseStringify(data);
  } catch {
    return { content: [], totalPages: 0, totalElements: 0 } as unknown as ApiResponse<Staff>;
  }
}

export async function getWarehouseStaffMember(id: string): Promise<Staff | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/staff/${id}`);
    return parseStringify(data);
  } catch {
    return null;
  }
}
