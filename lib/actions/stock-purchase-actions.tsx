"use server";

import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { ErrorResponseType } from "@/types/types";
import { StockPurchaseSchema } from "@/types/stock-purchases/schema";

import { stockIntakeReceiptSchema } from "@/types/stock-intake/schema";
import {
  StockIntakeFromLPOPayload,
  StockPurchase,
  SubmissionData,
} from "@/types/stock-purchases/type";

export const searchStockPurchases = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<StockPurchase>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();

    const data = await apiClient.post(
      `/api/stock-intake-purchase-order/${location?.id}/paginate`,
      query,
    );

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getStockPurchases = async (id: string): Promise<StockPurchase> => {
  const apiClient = new ApiClient();

  const location = await getCurrentLocation();

  if (!location?.id) {
    throw new Error("Location not found or invalid");
  }

  try {
    const stockPurchaseOrder = await apiClient.get(
      `/api/stock-intake-purchase-order/${location.id}/lookup?orderNumber=${id}`,
    );

    return parseStringify(stockPurchaseOrder);
  } catch (error) {
    console.error("Failed to fetch stock purchases:", error);
    throw error;
  }
};

export const previewPurchaseOrder = async (identifier: string | UUID) => {
  const apiClient = new ApiClient();
  try {
    const purchaseOrder = await apiClient.get(
      `/api/stock-intake-purchase-order/public/lookup?orderNumber=${identifier}`,
    );

    return parseStringify(purchaseOrder);
  } catch (error) {
    throw error;
  }
};

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
    // console.log("The purchase order is", response);
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

export const AcceptStockPurchase = async (
  id: string,
): Promise<StockPurchase> => {
  const apiClient = new ApiClient();

  try {
    const stockPurchaseOrder = await apiClient.get(
      `/api/stock-intake-purchase-order/public/accept/${id}`,
    );

    return parseStringify(stockPurchaseOrder);
  } catch (error) {
    console.error("Failed to accept purchase order:", error);
    throw error;
  }
};

export const receivePurchaseOrderAsStockIntake = async (
  data: SubmissionData,
  staffId: string,
  receivedAt?: string,
): Promise<ApiResponse<any>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    // Use provided receivedAt or default to current time
    const receiptTime = receivedAt || new Date().toISOString();

    // Prepare payload in exact API format
    const payload: StockIntakeFromLPOPayload = {
      staff: staffId,
      receivedAt: receiptTime,
      receivedItems: data.items.map((item) => ({
        stockIntakePurchaseOrderItem: item.itemId,
        quantityReceived: item.receivedQuantity,
        totalCost: item.unitCost * item.receivedQuantity,
      })),
    };

    // Validate payload with Zod schema before sending
    const validatedPayload = stockIntakeReceiptSchema.parse(payload);

    const response = await apiClient.post(
      `/api/stock-intake-purchase-order/${location?.id}/receive/${data.purchaseOrderId}`,
      validatedPayload,
    );

    return parseStringify(response);
  } catch (error) {
    console.error("Error receiving purchase order as stock intake:", error);
    throw error;
  }
};
