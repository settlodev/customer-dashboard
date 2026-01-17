"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { console } from "node:inspector";
import { StockModification } from "@/types/stock-modification/type";
import { StockModificationSchema } from "@/types/stock-modification/schema";
import { getCurrentLocation } from "../business/get-current-business";
import { getCurrentWarehouse } from "@/lib/actions/warehouse/register-action";

export const searchStockModificationsInWarehouse = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<StockModification>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        {
          key: "stockVariant.stock.name",
          operator: "LIKE",
          field_type: "STRING",
          value: q,
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const warehouse = await getCurrentWarehouse();
    const data = await apiClient.post(
      `/api/warehouse/stock-modifications/${warehouse?.id}`,
      query,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const createStockModificationInWarehouse = async (
  stockModifications: any[],
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  // Validate each stock modification item
  const validationResults = stockModifications.map((modification) =>
    StockModificationSchema.safeParse(modification),
  );

  const hasErrors = validationResults.some((result) => !result.success);

  if (hasErrors) {
    const firstError = validationResults.find((result) => !result.success);
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(firstError?.error.message || "Validation failed"),
    };
    return parseStringify(formResponse);
  }

  const warehouse = await getCurrentWarehouse();

  console.log("Valida warehouse is", warehouse);

  // Check if all modifications have the same staff member
  const uniqueStaffIds = [
    ...new Set(stockModifications.map((mod) => mod.staff)),
  ];

  if (uniqueStaffIds.length > 1) {
    formResponse = {
      responseType: "error",
      message:
        "All stock modifications must be assigned to the same staff member",
      error: new Error("Multiple staff members not allowed"),
    };
    return parseStringify(formResponse);
  }

  // Build payload according to API expectations
  const payload = {
    staff: stockModifications[0].staff,
    modifiedItems: stockModifications.map((modification) => ({
      reason: modification.reason,
      comment: modification.comment || null,
      quantity: modification.quantity,
      stockVariant: modification.stockVariant,
    })),
  };

  console.log("The payload passed is ", payload);

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      `/api/warehouse/stock-modifications/${warehouse?.id}/create`,
      payload,
    );
    formResponse = {
      responseType: "success",
      message: `${payload.modifiedItems.length} Stock Modification${payload.modifiedItems.length > 1 ? "s" : ""} recorded successfully`,
    };
  } catch (error: any) {
    console.log("The error occuring is ", error);

    let errorMessage =
      "Something went wrong while processing your request, please try again";

    // Handle Axios error response
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    // Handle custom error format
    else if (error?.message) {
      errorMessage = error.message;
    }

    formResponse = {
      responseType: "error",
      message: errorMessage,
      error: error instanceof Error ? error : new Error(errorMessage),
    };

    console.error("form response error", formResponse);

    return formResponse;
  }

  revalidatePath("/warehouse-stock-modifications");
  return parseStringify(formResponse);
};

export const getStockModifiedInWarehouse = async (
  id: UUID,
  stockVariant: UUID,
): Promise<ApiResponse<StockModification>> => {
  const apiClient = new ApiClient();
  const query = {
    filters: [
      {
        key: "id",
        operator: "EQUAL",
        field_type: "UUID_STRING",
        value: id,
      },
    ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const warehouse = await getCurrentWarehouse();
  const response = await apiClient.post(
    `/api/stock-modifications/${warehouse?.id}/${id}`,
    query,
  );

  return parseStringify(response);
};
