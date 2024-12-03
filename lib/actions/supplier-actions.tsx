"use server";

import { Supplier } from "@/types/supplier/type";
import { getAuthenticatedUser} from "../auth-utils";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { SupplierSchema } from "@/types/supplier/schema";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  await getAuthenticatedUser();
  
  try {
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    const supplierData = await apiClient.get(
      `/api/suppliers/${location?.id}`,
    );
    return parseStringify(supplierData);
  } catch (error) {
    throw error;
  }
};

export const searchSuppliers = async (
  q: string,
  page: number,
  pageLimit: number
): Promise<ApiResponse<Supplier>> => {
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

    const supplierData = await apiClient.post(
      `/api/suppliers/${location?.id}`,
      query
    );

    
    return parseStringify(supplierData);
  } catch (error) {
    throw error;
  }
};

export const createSupplier = async (
  supplier: z.infer<typeof SupplierSchema>
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;

  const supplierValidData = SupplierSchema.safeParse(supplier);

  if (!supplierValidData.success) {
    formResponse = {
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(supplierValidData.error.message),
    };
    return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const business = await getCurrentBusiness();

  const payload = {
    ...supplierValidData.data,
    location: location?.id,
    business: business?.id,
  };

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    await apiClient.post(
      `/api/suppliers/${location?.id}/create`,
      payload
    );
    formResponse = {
      responseType: "success",
      message: "Supplier created successfully",
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
  revalidatePath("/suppliers");
  return parseStringify(formResponse);
};


export const getSupplier = async (id: UUID): Promise<ApiResponse<Supplier>> => {
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

  const supplierResponse = await apiClient.post(
    `/api/suppliers/${location?.id}`,
    query
  );
  console.log("Supplier Response", supplierResponse)
  return parseStringify(supplierResponse);
};



export const updateSupplier = async (
  id: UUID,
  supplier: z.infer<typeof SupplierSchema>
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  const supplierValidData = SupplierSchema.safeParse(supplier);

  if (!supplierValidData.success) {
      formResponse = {
          responseType: "error",
          message: "Please fill all the required fields",
          error: new Error(supplierValidData.error.message),
      };
      return parseStringify(formResponse);
  }

  const location = await getCurrentLocation();
  const business = await getCurrentBusiness();

  const payload = {
    ...supplierValidData.data,
    location: location?.id,
    business: business?.id,
  };


  try {
      const apiClient = new ApiClient();

      await apiClient.put(
          `/api/suppliers/${location?.id}/${id}`, 
          payload
      );

      formResponse = {
          responseType: "success",
          message: "Supplier updated successfully",
      };

  } catch (error) {
      formResponse = {
          responseType: "error",
          message:
              "Something went wrong while processing your request, please try again",
          error: error instanceof Error ? error : new Error(String(error)),
      };
  }

  revalidatePath("/suppliers");
  return parseStringify(formResponse);
};


export const deleteSupplier = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Supplier ID is required to perform this request");
  await getAuthenticatedUser();

  try {
      const apiClient = new ApiClient();
      const location = await getCurrentLocation();

      await apiClient.delete(`/api/suppliers/${location?.id}/${id}`);
      revalidatePath("/suppliers");
  } catch (error) {
      throw error;
  }
};
