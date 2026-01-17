"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import {
  StockMovement,
  StockVariant,
  stockVariantSummary,
} from "@/types/stockVariant/type";

export const fetchStockVariants = async (
  stockId: string,
): Promise<StockVariant[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const data = await apiClient.get(`/api/stock-variants/${stockId}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const searchStockVariants = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<StockVariant>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "stock.name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
          isArchived: false,
        },
        {
          key: "isArchived",
          operator: "EQUAL",
          field_type: "BOOLEAN",
          value: false,
        },
      ],
      sorts: [
        {
          key: "dateCreated",
          direction: "DESC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();
    const data = await apiClient.post(
      `/api/stock-variants/${location?.id}/all`,
      query,
    );

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStockVariantMovement = async (
  id: string,
  page: number,
  size: number,
): Promise<ApiResponse<StockMovement>> => {
  await getAuthenticatedUser();

  const query = {
    sorts: [
      {
        key: "dateCreated",
        direction: "DESC",
      },
    ],
    page: page ? page - 1 : 0,
    size: size ? size : 10,
  };

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(`/api/stock-movements/${id}`, query);

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStockVariantSummary = async (
  id: UUID,
  stockId: UUID,
): Promise<stockVariantSummary> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const data = await apiClient.get<stockVariantSummary>(
      `/api/stock-variants/${stockId}/summary/${id}`,
    );

    return parseStringify(data || {});
  } catch (error) {
    throw error;
  }
};
