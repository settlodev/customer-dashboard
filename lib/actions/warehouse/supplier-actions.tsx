"use server";

import { Supplier } from "@/types/supplier/type";
import { ApiResponse, FormResponse } from "@/types/types";
import { SupplierSchema } from "@/types/supplier/schema";
import { UUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "../business/get-current-business";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentWarehouse } from "./current-warehouse-action";
import { SupplierCreditReports } from "@/types/warehouse/supplier/type";

export const searchSuppliers = async (
  q: string,
  page: number,
  pageLimit: number
): Promise<ApiResponse<Supplier>> => {
  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    const business = await getCurrentBusiness();

    const query = {
      filters: [
          {
              key: "name",
              operator: "LIKE",
              field_type: "STRING",
              value: q,
          },
          {
            key:"isArchived",
            operator:"EQUAL",
            field_type:"BOOLEAN",
            value:false
        }
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
      `/api/suppliers/${business?.id}`,
      query
    );
  // console.log("The supplier data",supplierData);
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

  
  const business = await getCurrentBusiness();

  const payload = {
    ...supplierValidData.data,
    business: business?.id,
  };

  await getAuthenticatedUser();

  try {
    const apiClient = new ApiClient();

    await apiClient.post(
      `/api/suppliers/${business?.id}/create`,
      payload
    );
    formResponse = {
      responseType: "success",
      message: "Supplier created successfully",
    };

  } catch (error:any) {
    console.error("Error creating supplier", error);
    formResponse = {
      responseType: "error",
      message:error.message || "Something went wrong while processing your request, please try again",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
  revalidatePath("/warehouse-suppliers");
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

  const business = await getCurrentBusiness();

  const supplierResponse = await apiClient.post(
    `/api/suppliers/${business?.id}`,
    query
  );
  
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

  
  const business = await getCurrentBusiness();

  const payload = {
    ...supplierValidData.data,
    
    business: business?.id,
  };


  try {
      const apiClient = new ApiClient();

      await apiClient.put(
          `/api/suppliers/${business?.id}/${id}`, 
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

  revalidatePath("/warehouse-suppliers");
  return parseStringify(formResponse);
};


export const deleteSupplier = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Supplier ID is required to perform this request");
  await getAuthenticatedUser();

  try {
      const apiClient = new ApiClient();
      const business = await getCurrentBusiness();

      await apiClient.delete(`/api/suppliers/${business?.id}/${id}`);
      revalidatePath("/warehouse-suppliers");
  } catch (error) {
      throw error;
  }
};

export const archievSupplier = async (id: UUID): Promise<void> => {
  if (!id) throw new Error("Supplier ID is required to perform this request");
  await getAuthenticatedUser();

  try {
      const apiClient = new ApiClient();
      const business = await getCurrentBusiness();

      await apiClient.delete(`/api/suppliers/${business?.id}/update-archive-status`);
      revalidatePath("/warehouse-suppliers");
  } catch (error) {
      console.error("Error archieving supplier", error);
      throw error;
  }
}

export const supplierCreditReportForWarehouse = async (): Promise<SupplierCreditReports | null> => {

  await getAuthenticatedUser();

  try {

      const apiClient = new ApiClient();
      const warehouse = await getCurrentWarehouse();
      const report=await apiClient.get(`/api/reports/${warehouse?.id}/suppliers-credit/summary`);
      return parseStringify(report);
      
  } catch (error) {
      console.error("Error fetching stock request report:", error);
      throw error;
  }
  
};