"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Brand } from "@/types/brand/type";
import { BrandSchema } from "@/types/brand/schema";

export const fectchAllBrands = async () : Promise<Brand[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const brandData = await  apiClient.get(
            `/api/brands/${location?.id}`,
        );
       
        return parseStringify(brandData);

    }
    catch (error){
        throw error;
    }
}
export const searchBrand = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Brand>> =>{
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
        const brandData = await  apiClient.post(
            `/api/brands/${location?.id}`,
            query
        );
        return parseStringify(brandData);
    }
    catch (error){
        throw error;
    }

}
export const  createBrand= async (
    brand: z.infer<typeof BrandSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validBrandData= BrandSchema.safeParse(brand)

    if (!validBrandData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validBrandData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();

    const payload = {
        ...validBrandData.data,
        location: location?.id
    }
    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/brands/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Brand created successfully",
        };
    }
    catch (error: any){
        const formattedError = await error;
        formResponse = {
            responseType: "error",
            message:formattedError.message,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/brands");
    return parseStringify(formResponse)
}

export const getBrand= async (id:UUID) : Promise<ApiResponse<Brand>> => {
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
    const brand= await apiClient.post(
        `/api/brands/${location?.id}`,
        query,
    );
    
    return parseStringify(brand)
}



export const updateBrand = async (
    id: UUID,
    brand: z.infer<typeof BrandSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validBrandData = BrandSchema.safeParse(brand);

    if (!validBrandData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validBrandData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validBrandData.data,
        location: location?.id,
    };

    

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/brands/${location?.id}/${id}`, 
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Brand updated successfully",
        };

    } catch (error) {
        console.error("Error while updating brand", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/brands");
    return parseStringify(formResponse);
};

export const deleteBrand = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Brand ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/brands/${location?.id}/${id}`,
    );
    revalidatePath("/brands");
    
   }
   catch (error){
       throw error
   }
}
