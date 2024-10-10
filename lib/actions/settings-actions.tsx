"use server";

import {z} from "zod";
import {CustomerSchema} from "@/types/customer/schema";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser, getAuthToken} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {Customer} from "@/types/customer/type";
import {UUID} from "node:crypto";
import {id} from "postcss-selector-parser";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { LocationSettings} from "@/types/locationSettings/type";
import { LocationSettingsSchema } from "@/types/locationSettings/schema";

export const fectchLocationSettings = async () : Promise<LocationSettings[]> => {
    await  getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const settingsData = await  apiClient.get(
            `/api/location-settings/${location?.id}`,
        );
       
        return parseStringify(settingsData);

    }
    catch (error){
        throw error;
    }
}
export const searchLocationSettings = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<LocationSettings>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"name",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const productData = await  apiClient.post(
            `/api/products/${location?.id}`,
            query
        );
        return parseStringify(productData);
    }
    catch (error){
        throw error;
    }

}
export const  createLocationSettings= async (
    settings: z.infer<typeof LocationSettingsSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validSettingsData= LocationSettingsSchema.safeParse(settings)

    if (!validSettingsData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validSettingsData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validSettingsData.data,
        locationId: location?.id,
    }
    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/location-settings/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating location settings",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    if (formResponse){
        return parseStringify(formResponse)
    }
    revalidatePath("/settings");
    redirect("/settings");
}

export const getLocationSettings = async (id:UUID) : Promise<ApiResponse<LocationSettings>> => {
    const apiClient = new ApiClient();
    const query ={
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
    }
    const location = await getCurrentLocation();
    const product = await apiClient.post(
        `/api/location-settings/${location?.id}`,
        query,
    );
    
    return parseStringify(product)
}



export const updateLocationSettings = async (
    id: UUID,
    setting: z.infer<typeof LocationSettingsSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validSettingsData = LocationSettingsSchema.safeParse(setting);

    if (!validSettingsData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validSettingsData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();
    const payload = {
        ...validSettingsData.data,
        location: location?.id,
        business: business?.id
    };

    

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/location-settings/${location?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error updating location settings", error); 
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
    revalidatePath("/settings");
    redirect("/settings");
};

export const deleteLocationSettings = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Location setting ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/location-settings/${location?.id}/${id}`,
    );
    revalidatePath("/settings");
    
   }
   catch (error){
       throw error
   }
}
