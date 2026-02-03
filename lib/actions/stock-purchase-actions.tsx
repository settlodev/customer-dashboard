"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { StockTransfer } from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";
import { ErrorResponseType } from "@/types/types";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";

export const fetchStockPurchases = async (): Promise<StockTransfer[]> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const data = await apiClient.get(
      `/api/stock-transfers/${location?.id}/all`,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};
export const searchStockPurchases = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<StockTransfer>> => {
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
    const location = await getCurrentLocation();
    const data = await apiClient.post(
      `/api/stock-transfers/${location?.id}`,
      query,
    );

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// export const createStockPurchase = async (
//   purchase: z.infer<typeof StockPurchaseSchema>,
// ): Promise<FormResponse | void> => {
//   let formResponse: FormResponse | null = null;
//
//   const validData = StockPurchaseSchema.safeParse(purchase);
//
//   if (!validData.success) {
//     formResponse = {
//       responseType: "error",
//       message: "Please fill all the required fields",
//       error: new Error(validData.error.message),
//     };
//     return parseStringify(formResponse);
//   }
//
//   const location = await getCurrentLocation();
//   const payload = {
//     ...validData.data,
//   };
//
//   try {
//     const apiClient = new ApiClient();
//     await apiClient.post(
//       `/api/stock-intake-purchase-order/${location?.id}/create`,
//       payload,
//     );
//
//     formResponse = {
//       responseType: "success",
//       message: "Stock purchase created successfully",
//     };
//   } catch (error: any) {
//     const apiError = error as ErrorResponseType;
//
//     console.error("Error creating stock purchase:", {
//       status: apiError.status,
//       code: apiError.code,
//       message: apiError.message,
//       correlationId: apiError.correlationId,
//       details: apiError.details,
//     });
//
//     formResponse = {
//       responseType: "error",
//       message:
//         apiError.message ||
//         "An error occurred while creating the stock purchase",
//       error: new Error(apiError.message),
//     };
//   }
//
//   revalidatePath("/stock-purchases");
//   return parseStringify(formResponse);
// };

export const createStockPurchase = async (
  purchase: z.infer<typeof StockPurchaseSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validData = StockPurchaseSchema.safeParse(purchase);

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  // Transform data to match API expected format
  const payload = {
    supplier: validData.data.supplier,
    notes: validData.data.notes,
    deliveryDate: validData.data.deliveryDate,
    stockIntakePurchaseOrderItems:
      validData.data.stockIntakePurchaseOrderItems.map((item) => ({
        stockVariantId: item.stockVariantId,
        quantity: item.quantity,
      })),
  };

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      `/api/stock-intake-purchase-order/${location?.id}/create`,
      payload,
    );
    console.log("The purchase order is", response);
    formResponse = {
      data: response,
      responseType: "success",
      message: "Stock purchase order created successfully",
    };
  } catch (error: any) {
    const apiError = error as ErrorResponseType;

    console.error("Error creating stock purchase:", {
      status: apiError.status,
      code: apiError.code,
      message: apiError.message,
      correlationId: apiError.correlationId,
      details: apiError.details,
    });

    formResponse = {
      responseType: "error",
      message:
        apiError.message ||
        "An error occurred while creating the stock purchase",
      error: new Error(apiError.message),
    };
  }

  revalidatePath("/stock-purchases");
  return parseStringify(formResponse);
};
