"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import {Product} from "@/types/product/type";
import {ProductSchema} from "@/types/product/schema";

export const fectchAllProducts = async () : Promise<Product[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/products/${location?.id}`,
        );

        return parseStringify(data);

    }
    catch (error){
        throw error;
    }
}
export const searchProducts = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Product>> =>{
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
        const data = await  apiClient.post(
            `/api/products/${location?.id}`,
            query
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const  createProduct= async (
    product: z.infer<typeof ProductSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData= ProductSchema.safeParse(product)

    if (!validData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...validData.data,
        location: location?.id,
        business: business?.id
    }
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/products/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating product",error)
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
    revalidatePath("/products");
    redirect("/products")
}

export const getProduct= async (id:UUID) : Promise<ApiResponse<Product>> => {
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
    const response = await apiClient.post(
        `/api/products/${location?.id}`,
        query,
    );

    return parseStringify(response)
}


export const updateProduct = async (
    id: UUID,
    product: z.infer<typeof ProductSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validData = ProductSchema.safeParse(product);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validData.data,
        location: location?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/products/${location?.id}/${id}`,
            payload
        );

    } catch (error) {
        console.error("Error updating product", error);
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
    revalidatePath("/products");
    redirect("/products");
};

export const deleteProduct = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Product ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();

    await apiClient.delete(
        `/api/products/${location?.id}/${id}`,
    );
    revalidatePath("/products");

   }
   catch (error){
       throw error
   }
}