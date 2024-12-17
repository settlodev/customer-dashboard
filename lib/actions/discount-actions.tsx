"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { Discount } from "@/types/discount/type";
import { DiscountSchema } from "@/types/discount/schema";
// import { resolveError } from "../settlo-api-error-handler";

export const fectchAllDicounts = async () : Promise<Discount[]> => {
    await  getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const discountData = await  apiClient.get(
            `/api/discounts/${location?.id}`,
        );
       
        return parseStringify(discountData);

    }
    catch (error){
        throw error;
    }
}
export const searchDiscount = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Discount>> =>{
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
        const discountData = await  apiClient.post(
            `/api/discounts/${location?.id}`,
            query
        );
        console.log("The discount data is: ", discountData)
        return parseStringify(discountData);
    }
    catch (error){
        throw error;
    }

}
export const  createDiscount= async (
    discount: z.infer<typeof DiscountSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const discountValidData= DiscountSchema.safeParse(discount)

    if (!discountValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(discountValidData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...discountValidData.data,
        location: location?.id,
        business: business?.id
    }
    console.log('Payload:', payload);
    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/discounts/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Discount created successfully",
        };
    }
    catch (error){
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/discounts");
    return parseStringify(formResponse);
}

export const getDiscount= async (id:UUID) : Promise<ApiResponse<Discount>> => {
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
    const discountResponse = await apiClient.post(
        `/api/discounts/${location?.id}`,
        query,
    );
    
    return parseStringify(discountResponse)
}



export const updateDiscount = async (
    id: UUID,
    discount: z.infer<typeof DiscountSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const discountValidData = DiscountSchema.safeParse(discount);

    if (!discountValidData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(discountValidData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...discountValidData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/discounts/${location?.id}/${id}`, 
            payload
        );

        formResponse = {
            responseType: "success",
            message: "Discount updated successfully",
        };

    } catch (error) {
        console.error("Error updating discount", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/discounts");
    return parseStringify(formResponse);
};

export const deleteDiscount = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Discount ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/discounts/${location?.id}/${id}`,
    );
    revalidatePath("/discounts");
    
   }
   catch (error){
       throw error
   }
}
