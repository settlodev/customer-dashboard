"use server";

import { getAuthenticatedUser} from "../auth-utils";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { KDS } from "@/types/kds/type";
import { KDSSchema } from "@/types/kds/schema";

export const fetchAllKDS = async (): Promise<KDS[]> => {
  await getAuthenticatedUser();
  
  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const kdsData = await apiClient.get(
      `/api/spaces/${location?.id}`,
    );
    return parseStringify(kdsData);
  } catch (error) {
    throw error;
  }
};

export const searchKDS = async (
  q: string,
  page: number,
  pageLimit: number
): Promise<ApiResponse<KDS>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const query = {
      filters: [
          {
              key: "name",
              operator: "LIKE",
              field_type: "STRING",
              value: q,
          },
      ],
      sorts: [
        {
          key: "name",
          direction: "ASC",
        },
      ],
      page: page ? page - 1 : 0,
      size: pageLimit ? pageLimit : 10,
    };

    const kdsData = await apiClient.post(
      `/api/kds/${location?.id}`,
      query
    );

    
    return parseStringify(kdsData);
  } catch (error) {
    throw error;
  }
};

export const createKDS = async (
  kds: z.infer<typeof KDSSchema>
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const validKDSData = KDSSchema.safeParse(kds);

  if (!validKDSData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validKDSData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const business = await getCurrentBusiness();

  const payload = {
    ...validKDSData.data,
    location: location?.id,
    business: business?.id,
  };

  await getAuthenticatedUser();
  
  try {
    const apiClient = new ApiClient();
   await apiClient.post(
      `/api/kds/${location?.id}/create`,
      payload
    );
    formResponse = {
      responseType: "success",
      message: "KDS created successfully",
    };
    
  } catch (error) {
    console.error("Error creating supplier", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  revalidatePath("/kds");
  return parseStringify(formResponse);
 
};

export const getKDS = async (id: UUID): Promise<ApiResponse<KDS>> => {
  const apiClient = new ApiClient();
 
  const query = {
    filters:[
        {
            key: "id",
            operator: "EQUAL",
            field_type: "UUID_STRING",
            value: id,
        }
    ],
    sorts: [],
    page: 0,
    size: 1,
  };

  const location = await getCurrentLocation();

  const kdsResponse = await apiClient.post(
    `/api/kds/${location?.id}`,
    query
  );
  return parseStringify(kdsResponse);
};



export const updateKDS = async (
  id: UUID,
  kds: z.infer<typeof KDSSchema>
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const validKDSData = KDSSchema.safeParse(kds);

  if (!validKDSData.success) {
      formResponse = {
          responseType: "error",
          message: "Please fill all the required fields",
          error: new Error(validKDSData.error.message),
      };
      return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();

  const payload = {
    ...validKDSData.data,
    location: location?.id,
  };


  try {
      const apiClient = new ApiClient();

      await apiClient.put(
          `/api/kds/${location?.id}/${id}`, 
          payload
      );

      formResponse = {
          responseType: "success",
          message: "KDS updated successfully",
      };

  } catch (error) {
      console.error("Error updating kds", error); 
      formResponse = {
          responseType: "error",
          message:
              "Something went wrong while processing your request, please try again",
          error: error instanceof Error ? error : new Error(String(error)),
      };
  }

  revalidatePath("/kds");
  return parseStringify(formResponse);
};


export const deleteKDS = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("KDS ID is required to perform this request");
  await getAuthenticatedUser();

  try {
      const apiClient = new ApiClient();
      const location = await getCurrentLocation();

      await apiClient.delete(`/api/kds/${location?.id}/${id}`);

      revalidatePath("/kds");

  } catch (error) {
      throw error;
  }
};
