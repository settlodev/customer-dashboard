"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { Variant } from "@/types/variant/type";
import { StockVariantSchema } from "@/types/stockVariant/schema";
import { StockVariant } from "@/types/stockVariant/type";

export const fetchStockVariants = async (stockId: string) : Promise<StockVariant[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

    
        const data = await  apiClient.get(
            `/api/stock-variants/${stockId}`,
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
export const  createStockVariant= async (
    stockId:UUID,
    variant: z.infer<typeof StockVariantSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData= StockVariantSchema.safeParse(variant)

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
        stock: stockId
    }
    console.log("payload:", payload);

    try {
        const apiClient = new ApiClient();
        await apiClient.post(
            `/api/stock-variants/${stockId}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating stock variant",error)
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
        `/api/stock-variants/${product?.id}`,
        query,
    );

    return parseStringify(response)
}


export const updateStockVariant = async (
    id: UUID,
    stockId: UUID,
    variant: z.infer<typeof StockVariantSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validData = StockVariantSchema.safeParse(variant);

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
        stock: stockId
    };
    console.log("The payload to update stock", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/stock-variants/${stockId}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating stock variant", error);
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

export const deleteStockVariant = async (id: UUID, stockId: UUID): Promise<void> => {
    if (!id) throw new Error("Stock ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    await apiClient.delete(
        `/api/stock-variants/${stockId}/${id}`,
    );
    
   }
   catch (error){
       throw error
   }
}
