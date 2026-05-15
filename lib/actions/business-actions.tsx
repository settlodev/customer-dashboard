"use server";

type UUID = string;

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import { FormResponse } from "@/types/types";
import { Business } from "@/types/business/type";
import { BusinessSchema } from "@/types/business/schema";

export const fetchBusinessType = async () => {
  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;

    const response = await apiClient.get("/api/v1/public/business-types");

    return parseStringify(response);
  } catch (error) {
    throw error;
  }
};

export const fetchAllBusinesses = async (): Promise<Business[] | null> => {
  try {
    const apiClient = new ApiClient();

    const data = await apiClient.get(`/api/v1/businesses`);

    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

export const updateBusiness = async (
  id: UUID,
  business: z.infer<typeof BusinessSchema>,
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const apiClient = new ApiClient();

  const validatedData = BusinessSchema.safeParse(business);

  if (!validatedData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    };

    return parseStringify(formResponse);
  }

  try {
    await apiClient.put(`/api/v1/businesses/${id}`, validatedData.data);

    formResponse = {
      responseType: "success",
      message: "Business updated successfully",
    };
  } catch (error: unknown) {
    const formattedError = error as Record<string, unknown> & {
      message?: string;
      details?: { fieldErrors?: unknown };
    };
    console.error("Error updating business - Full Details:", {
      ...formattedError,
      details: {
        ...formattedError.details,
        fieldErrors: JSON.stringify(formattedError.details?.fieldErrors, null, 2),
      },
    });

    formResponse = {
      responseType: "error",
      message:
        formattedError.message ??
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/settings");
  return parseStringify(formResponse);
};

export const getSingleBusiness = async (id: UUID): Promise<Business> => {
  const apiClient = new ApiClient();

  const data = await apiClient.get(`/api/v1/businesses/${id}`);
  return parseStringify(data);
};

