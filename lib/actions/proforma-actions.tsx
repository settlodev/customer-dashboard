"use server";

import { UUID } from "node:crypto";
import { ApiResponse, FormResponse } from "@/types/types";
import ApiClient from "@/lib/settlo-api-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { parseStringify } from "@/lib/utils";
import { Proforma } from "@/types/proforma/type";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AddItemsToProformaSchema,
  ProformaSchema,
  UpdateProformaSchema,
} from "@/types/proforma/schema";
import { Product } from "@/types/product/type";

export const searchProformaInvoices = async (
  q: string,
  page: number,
  pageLimit: number,
): Promise<ApiResponse<Proforma>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();
    const query = {
      filters: [
        // {
        //   key: "name",
        //   operator: "LIKE",
        //   field_type: "STRING",
        //   value: q,
        // },
        // {
        //   key: "isArchived",
        //   operator: "EQUAL",
        //   field_type: "BOOLEAN",
        //   value: false,
        // },
      ],
      sorts: [
        {
          key: "dateCreated",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };
    const location = await getCurrentLocation();

    const data = await apiClient.post(
      `/api/location/${location?.id}/order-proforma/paginate`,
      query,
    );
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const getProforma = async (id: UUID): Promise<Proforma | null> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    if (!location?.id) {
      throw new Error("No active location found");
    }

    const response = await apiClient.get(
      `/api/location/${location.id}/order-proforma/${id}`,
    );
    if (!response) return null;

    return parseStringify(response) as Proforma;
  } catch (error) {
    console.error(`[getProforma] Error fetching proforma ${id}:`, error);
    throw error;
  }
};

export const createProforma = async (
  customer: z.infer<typeof ProformaSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validData = ProformaSchema.safeParse(customer);

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...validData.data,
  };
  try {
    const apiClient = new ApiClient();

    const response = await apiClient.post(
      `/api/location/${location?.id}/order-proforma/create`,
      payload,
    );

    const formResponse = {
      responseType: "success",
      message: "Proforma created successfully",
      data: response,
    };
    return parseStringify(formResponse);
  } catch (error) {
    console.error("Error creating proforma", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
    console.error("Formatted Error creating proforma", error);
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/proforma-invoice");
  return parseStringify(formResponse);
};

export const addItemsToProforma = async (
  proformaId: string,
  items: z.infer<typeof AddItemsToProformaSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validData = AddItemsToProformaSchema.safeParse(items);

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const payload = {
    ...validData.data,
  };
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.post(
      `/api/order-proforma/${proformaId}/order-proforma-items/create`,
      payload,
    );
    formResponse = {
      responseType: "success",
      message: "Proforma items added successfully",
      data: response,
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/proforma-invoice");
  return parseStringify(formResponse);
};

export const removeItemsToProforma = async (
  proformaId: string,
  itemId: string,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.delete(
      `/api/order-proforma/${proformaId}/order-proforma-items/${itemId}`,
    );
    formResponse = {
      responseType: "success",
      message: "Proforma items removed successfully",
      data: response,
    };
  } catch (error) {
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath("/proforma-invoice");
  return parseStringify(formResponse);
};

export const updateProforma = async (
  proformaId: string,
  notes: string,
  discount: string,
  manualDiscountAmount: number,
  expiresAt: string,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validData = UpdateProformaSchema.safeParse({
    notes,
    discount,
    manualDiscountAmount,
    expiresAt,
  });

  if (!validData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validData.error.message),
    };
    return parseStringify(formResponse);
  }

  const formattedDueDate = validData.data.expiresAt
    ? new Date(validData.data.expiresAt).toISOString()
    : null;

  // Only include discount or manualDiscountAmount — not both.
  const payload: Record<string, unknown> = {
    notes: validData.data.notes || null,
    dueDate: formattedDueDate,
  };

  if (validData.data.discount) {
    // API-side discount: pass the discount ID
    payload.discount = validData.data.discount;
    payload.manualDiscountAmount = 0;
  } else if (validData.data.manualDiscountAmount > 0) {
    // Manual TZS amount: omit discount ID, send the amount
    payload.manualDiscountAmount = validData.data.manualDiscountAmount;
  }

  console.log("payload to update proforma", payload);

  const location = await getCurrentLocation();

  try {
    const apiClient = new ApiClient();
    const response = await apiClient.put(
      `/api/location/${location?.id}/order-proforma/${proformaId}`,
      payload,
    );

    formResponse = {
      responseType: "success",
      message: "Proforma updated successfully",
      data: response,
    };
  } catch (error) {
    console.log("The error occuring is", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
    console.log("The error occuring is", formResponse);
    return parseStringify(formResponse);
  }

  revalidatePath("/proforma-invoices");
  return parseStringify(formResponse);
};

export const updateProformaStatusAsCompleted = async (
  proformaId: string,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const location = await getCurrentLocation();
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.put(
      `/api/location/${location?.id}/order-proforma/${proformaId}/mark-complete`,
      {},
    );
    formResponse = {
      responseType: "success",
      message: "Proforma is completed",
      data: response,
    };
  } catch (error) {
    console.log("The error occuring is", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  if (formResponse?.responseType === "error")
    return parseStringify(formResponse);

  revalidatePath(`/proforma-invoice/details/${proformaId}`);
  return parseStringify(formResponse);
};
