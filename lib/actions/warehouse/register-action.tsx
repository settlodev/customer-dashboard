'use server'

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { RegisterWarehouseSchema } from "@/types/warehouse/register-warehose-schema";
import { FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";
import { getCurrentBusiness } from "../business/get-current-business";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Warehouses } from "@/types/warehouse/warehouse/type";
export const createWarehouse = async (
    warehouse: z.infer<typeof RegisterWarehouseSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    await getAuthenticatedUser();
    const validatedData = RegisterWarehouseSchema.safeParse(warehouse);

    console.log("The validated data",validatedData)

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
        
        revalidatePath("/warehouses");
        return parseStringify(formResponse)
        
    } catch (error) {
        console.error("Error is: ", error);
        formResponse = {
            responseType:"error",
            message:"Something went wrong",
            error:new Error("Something went wrong")
        }
    }
    if ( formResponse.responseType === "error" ) return parseStringify(formResponse)

     
    //  redirect("/warehouses");   
}

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

    console.log("locationCookie: ", warehouseCookie);
   
    if (!warehouseCookie) return undefined;

    try {
        return JSON.parse(warehouseCookie.value) as Warehouses;
    } catch (error) {
        console.error("Failed to parse warehouse cookie:", error);
        return undefined;
    }
};