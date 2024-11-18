"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Addon } from "@/types/addon/type";
import { AddonSchema } from "@/types/addon/schema";

export const fectchAdons = async () : Promise<Addon[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const addonData = await  apiClient.get(
            `/api/brands/${location?.id}`,
        );

        return parseStringify(addonData);

    }
    catch (error){
        throw error;
    }
}
export const searchAddon = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Addon>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"title",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"title",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        console.log("The location passed is: ", location)
        const addonData = await  apiClient.post(
            `/api/addons/${location?.id}`,
            query
        );
        
        return parseStringify(addonData);
    }
    catch (error){
        throw error;
    }

}
export const  createAddon= async (
    addon: z.infer<typeof AddonSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validAddonData= AddonSchema.safeParse(addon)


    if (!validAddonData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validAddonData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validAddonData.data,
        location: location?.id
    }

    console.log("payload:", payload);
    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/addons/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error while creating addons",error)
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
    revalidatePath("/addons");
    redirect("/addons")
}

export const getAddon= async (id:UUID) : Promise<ApiResponse<Addon>> => {
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
    const addon= await apiClient.post(
        `/api/addons/${location?.id}`,
        query,
    );
    
    return parseStringify(addon)
}



export const updateAddon = async (
    id: UUID,
    addon: z.infer<typeof AddonSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validAddonData = AddonSchema.safeParse(addon);

    if (!validAddonData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validAddonData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validAddonData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/addons/${location?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error while updating addon", error); 
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
    revalidatePath("/addons");
    redirect("/addons");
};

export const deleteAddon = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Addon ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/addons/${location?.id}/${id}`,
    );
    revalidatePath("/addons");
    
   }
   catch (error){
       throw error
   }
}
