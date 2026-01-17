'use server'

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { RegisterWarehouseSchema } from "@/types/warehouse/register-warehose-schema";
import { ApiResponse, FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";
import { getCurrentBusiness } from "../business/get-current-business";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { StockVariant } from "@/types/stockVariant/type";


export const createWarehouse = async (
    warehouse: z.infer<typeof RegisterWarehouseSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    await getAuthenticatedUser();
    const validatedData = RegisterWarehouseSchema.safeParse(warehouse);


    if (!validatedData.success) {
        
        formResponse = {
            responseType:"error",
            message: "Please fill in all the fields marked with * before proceeding",
            error:new Error(validatedData.error.message)
      }
      return parseStringify(formResponse)
    }

    const business = await getCurrentBusiness();

    const payload = {
        ...validatedData.data,
    }

    try {
        const apiClient = new ApiClient();
        await apiClient.post(`/api/warehouses/${business?.id}/create`, payload);

        formResponse = {
            responseType:"success",
            message:"Warehouse created successfully",
        }
        
        
        return parseStringify(formResponse)
        
    } catch (error) {
        console.error("Error is: ", error);
        
        let errorMessage = "Something went wrong";
        
        // Handle specific error codes
        if (error instanceof Error && (error as any).status === 409 || (error as any).code === 'CONFLICT' || (error as any).code === 'DUPLICATE') {
            // This is a duplicate warehouse name error
            errorMessage = (Error as any).message || "A warehouse with this name already exists in your business";
        }
        formResponse = {
            responseType:"error",
            message: errorMessage,
            error: new Error(errorMessage)
        }
        
        return parseStringify(formResponse);
}

};

export const updateWarehouse = async (
    warehouse: z.infer<typeof RegisterWarehouseSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    await getAuthenticatedUser();
    const validatedData = RegisterWarehouseSchema.safeParse(warehouse);


    if (!validatedData.success) {
        
        formResponse = {
            responseType:"error",
            message: "Please fill in all the fields marked with * before proceeding",
            error:new Error(validatedData.error.message)
      }
      return parseStringify(formResponse)
    }

    const business = await getCurrentBusiness();

    const warehouseId= await getCurrentWarehouse()

    const payload = {
        ...validatedData.data,
    }

    try {
        const apiClient = new ApiClient();
        await apiClient.put(`/api/warehouses/${business?.id}/${warehouseId?.id}`, payload);

        formResponse = {
            responseType:"success",
            message:"Warehouse updated successfully",
        }
        
        return parseStringify(formResponse)
        
    } catch (error) {
        console.error("Error is: ", error);
        
        let errorMessage = "Something went wrong";
        
        // Handle specific error codes
        if (error instanceof Error && (error as any).status === 409 || (error as any).code === 'CONFLICT' || (error as any).code === 'DUPLICATE') {
            // This is a duplicate warehouse name error
            errorMessage = (Error as any).message || "A warehouse with this name already exists in your business";
        }
        formResponse = {
            responseType:"error",
            message: errorMessage,
            error: new Error(errorMessage)
        }
        
        return parseStringify(formResponse);
}

};

export const refreshWarehouse = async (data: Warehouses): Promise<void> => {

    if (!data) throw new Error("Business ID is required to perform this request");
    const cookieStore =await cookies();
    cookieStore.set({
        name: "currentWarehouse",
        value: JSON.stringify(data),
        sameSite: "strict"
    });

    revalidatePath("/warehouse");
};

export const getCurrentWarehouse = async (): Promise<Warehouses | undefined> => {
    const cookieStore = await cookies();
    const warehouseCookie = cookieStore.get("currentWarehouse");

   
    if (!warehouseCookie) return undefined;

    try {
        return JSON.parse(warehouseCookie.value) as Warehouses;
    } catch (error) {
        console.error("Failed to parse warehouse cookie:", error);
        console.error("Failed to parse warehouse cookie:", error);
        return undefined;
    }
};

export const searchStockVariantsInWarehouse = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockVariant>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"stockAndStockVariantName",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q,
                    isArchived:false
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
            ],
            sorts:[
                {
                    key:"dateCreated",
                    direction:"DESC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const warehouse = await getCurrentWarehouse();
        const data = await  apiClient.post(
            `/api/stock-variants/${warehouse?.id}/all`,
            query
        );

        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}