"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Modifier } from "@/types/modifiers/type";
import { ModifierSchema } from "@/types/modifiers/schema";

export const fetchModifier = async () : Promise<Modifier[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const modifierData = await  apiClient.get(
            `/api/modifiers/${location?.id}`,
        );

        return parseStringify(modifierData);

    }
    catch (error){
        throw error;
    }
}


export const searchModifier = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Modifier>> =>{
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
        const modifierData = await  apiClient.post(
            `/api/modifiers/${location?.id}`,
            query
        );
        
        return parseStringify(modifierData);
    }
    catch (error){
        throw error;
    }

}
export const  createModifier= async (
    modifier: z.infer<typeof ModifierSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validModifierData= ModifierSchema.safeParse(modifier)


    if (!validModifierData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validModifierData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validModifierData.data,
        location: location?.id
    }

    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/modifiers/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Modifier created successfully",
        };
    }
    catch (error){
        console.error("Error while creating modifiers",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    revalidatePath("/modifiers");
    return parseStringify(formResponse);
}

export const getModifier= async (id:UUID) : Promise<ApiResponse<Modifier>> => {
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
    const modifier= await apiClient.post(
        `/api/modifiers/${location?.id}`,
        query,
    );
    
    return parseStringify(modifier)
}

export const updateModifier = async (
    id: UUID,
    modifier: z.infer<typeof ModifierSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validModifierData = ModifierSchema.safeParse(modifier);

    if (!validModifierData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validModifierData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validModifierData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/modifiers/${location?.id}/${id}`, 
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Modifier updated successfully",
        };

    } catch (error) {
        console.error("Error while updating modifier", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/modifiers");
    return parseStringify(formResponse);
};

export const deleteModifier = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Modifier ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/modifiers/${location?.id}/${id}`,
    );
    revalidatePath("/modifiers");
    
   }
   catch (error){
       throw error
   }
}

