"use server";

import { Supplier } from "@/types/supplier/type";
import { getAuthenticatedUser, getAuthToken } from "../auth-utils";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { ApiResponse, FormResponse } from "@/types/types";
import { SupplierSchema } from "@/types/supplier/schema";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  await getAuthenticatedUser();
  const authToken = await getAuthToken();
  try {
    const apiClient = new ApiClient();
    const supplierData = await apiClient.get(
      `/api/suppliers/${authToken?.locationId}`
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
  const authToken = await getAuthToken();
  try {
    const apiClient = new ApiClient();

    const query = {
      // filters: [
      //     {
      //         key: "name",
      //         operator: "LIKE",
      //         field_type: "STRING",
      //         value: q,
      //     },
      // ],
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
      `/api/suppliers/2e5a964c-41d4-46b7-9377-c547acbf7739`,
      query
    );

    console.log("Action response", supplierData);
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

  const payload = {
    ...supplierValidData.data,
    locationId: "6ed59bf2-b994-4fdb-90b7-5a38285e0a16",
    business: "6dce2391-2af7-4851-936b-be62637033c7",
  };

  await getAuthenticatedUser();
  const authToken = await getAuthToken();
  const locationId = "6ed59bf2-b994-4fdb-90b7-5a38285e0a16";
  try {
    const apiClient = new ApiClient();
    const supplierData = await apiClient.post(
      `/api/suppliers/${locationId}/create`,
      payload
    );
    console.log("The supplier created is", supplierData);
    return parseStringify(supplierData);
  } catch (error) {
    console.error("Error creating supplier", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  if (formResponse) {
    return parseStringify(formResponse);
  }
  revalidatePath("/suppliers");
  redirect("/suppliers");
};

export const getSupplier = async (id: UUID): Promise<ApiResponse<Supplier>> => {
  const apiClient = new ApiClient();
  const authToken = await getAuthToken();
  const query = {
    // filters:[
    //     {
    //         key: "id",
    //         operator: "EQUAL",
    //         field_type: "UUID_STRING",
    //         value: id,
    //     }
    // ],
    sorts: [],
    page: 0,
    size: 1,
  };
  const supplierResponse = await apiClient.post(
    `/api/suppliers/6ed59bf2-b994-4fdb-90b7-5a38285e0a16`,
    query
  );
  console.log("Customer response with post request", supplierResponse);
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
  const payload = {
    ...supplierValidData.data,
    locationId: "6ed59bf2-b994-4fdb-90b7-5a38285e0a16",
    business: "6dce2391-2af7-4851-936b-be62637033c7",
  };

  await getAuthenticatedUser();
  const authToken = await getAuthToken();
  const locationId= "6ed59bf2-b994-4fdb-90b7-5a38285e0a16"
  try {
    const apiClient = new ApiClient();
    const supplierData = await apiClient.put(
      `/api/suppliers/6ed59bf2-b994-4fdb-90b7-5a38285e0a16/31746cb3-2799-4acc-85b3-bd3284e4fbc9`,
      payload
    );
    return parseStringify(supplierData);
  } catch (error) {
    console.error("Error creating supplier", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  if (formResponse) {
    return parseStringify(formResponse);
  }
  revalidatePath("/suppliers");
  redirect("/suppliers");
};

export const deleteSupplier = async (
  id: UUID
): Promise<FormResponse | void> => {
  let formResponse: FormResponse | null = null;
  await getAuthenticatedUser();
  const authToken = await getAuthToken();
  try {
    const apiClient = new ApiClient();
    const supplierData = await apiClient.delete(
      `/api/suppliers/${authToken?.locationId}/${id}`
    );
    return parseStringify(supplierData);
  } catch (error) {
    console.error("Error creating supplier", error);
    formResponse = {
      responseType: "error",
      message:
        "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  if (formResponse) {
    return parseStringify(formResponse);
  }
};
