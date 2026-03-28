"use server";

import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { ApiResponse } from "@/types/types";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getCurrentWarehouse } from "./current-warehouse-action";

export const getWarehouse = async (
  id?: string,
): Promise<Warehouses | null> => {
  try {
    const business = await getCurrentBusiness();

    if (!business) {
      return null;
    }

    const apiClient = new ApiClient();
    const warehouseId = id || (await getCurrentWarehouse())?.id;

    if (!warehouseId) return null;

    const warehousesData = await apiClient.get(
      `/api/v1/warehouses/${warehouseId}`,
    );

    return parseStringify(warehousesData);
  } catch (error) {
    console.error("Error in getWarehouses:", error);
    return null;
  }
};

export const searchWarehouses = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Warehouses>> => {
  try {
    const business = await getCurrentBusiness();
    const apiClient = new ApiClient();

    const data = await apiClient.get<Warehouses[]>(
      `/api/v1/warehouses${business?.id ? `?businessId=${business.id}` : ""}`,
    );

    // The new API returns a flat list. Wrap it in ApiResponse format
    // for backward compatibility with existing components.
    const items = Array.isArray(data) ? data : [];

    return parseStringify({
      content: items,
      totalPages: 1,
      totalElements: items.length,
      first: true,
      last: true,
      size: items.length,
      number: 0,
      numberOfElements: items.length,
      empty: items.length === 0,
    } as ApiResponse<Warehouses>);
  } catch (error) {
    console.error("Error in search warehouses:", error);
    // Return empty result instead of throwing
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      first: true,
      last: true,
      size: 0,
      number: 0,
      numberOfElements: 0,
      empty: true,
    } as unknown as ApiResponse<Warehouses>;
  }
};
