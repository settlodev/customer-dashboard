"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Variant } from "@/types/variant/type";
import { VariantSchema } from "@/types/variant/schema";

export const fetchVariants = async () : Promise<Variant[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const product = "5b6ba5c1-106a-43a3-b3be-e91ce4279add"

        const data = await  apiClient.get(
            `/api/variants/${product}`,
        );

        return parseStringify(data);

    }
    catch (error){
        throw error;
    }
}
export const searchVariants = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Variant>> =>{
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
        const product = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/products/${product?.id}`,
            query
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const  createVariant= async (
    productId:UUID,
    variant: z.infer<typeof VariantSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData= VariantSchema.safeParse(variant)
    

    if (!validData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validData.error.message)
      }
      return parseStringify(formResponse)
    }

    
    const payload = {
        ...validData.data,
        product: productId
    }
    // console.log("payload:", payload);

    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/variants/${productId}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating variant",error)
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    if (formResponse){
        return parseStringify(formResponse)
    }
    
}

export const getVariant= async (id:UUID) : Promise<ApiResponse<Variant>> => {
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
    const product = await getCurrentLocation();
    const response = await apiClient.post(
        `/api/variants/${product?.id}`,
        query,
    );

    return parseStringify(response)
}


export const updateVariant = async (
    id: UUID,
    productId: UUID,
    variant: z.infer<typeof VariantSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validData = VariantSchema.safeParse(variant);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message),
        };
        return parseStringify(formResponse);
    }

    const payload = {
        ...validData.data,
        product: productId
    };
    console.log("The payload to update item", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/variants/${productId}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating item", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
 
};

export const deleteVariant = async (id: UUID, productId: UUID): Promise<void> => {
    if (!id) throw new Error("Product ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    await apiClient.delete(
        `/api/variants/${productId}/${id}`,
    );
    
   }
   catch (error){
       throw error
   }
}
