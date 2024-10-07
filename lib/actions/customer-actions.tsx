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
import { getCurrentLocation } from "./business/get-current-business";

export const fectchAllCustomers = async () : Promise<Customer[]> => {
    await  getAuthenticatedUser();

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const customerData = await  apiClient.get(
            `/api/customers/${location?.id}`,
        );
       
        return parseStringify(customerData);

    }
    catch (error){
        throw error;
    }
}
export const searchCustomer = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Customer>> =>{
    await getAuthenticatedUser();

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"firstName",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"firstName",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const customerData = await  apiClient.post(
            `/api/customers/${location?.id}`,
            query
        );
        console.log("Customer response",customerData);
        return parseStringify(customerData);
    }
    catch (error){
        throw error;
    }

}
export const  createCustomer= async (
    customer: z.infer<typeof CustomerSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const customerValidData= CustomerSchema.safeParse(customer)
    console.log("Customer Valid Data", customerValidData)

    if (!customerValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(customerValidData.error.message)
      }
      return parseStringify(formResponse)
    }

    const payload = {
        ...customerValidData.data,
        locationId: '6ed59bf2-b994-4fdb-90b7-5a38285e0a16'
    }
    try {
        const apiClient = new ApiClient();
      
        const location = await getCurrentLocation();

        await apiClient.post(
            `/api/customers/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error creating customer",error)
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
    revalidatePath("/customers");
    redirect("/customers")
}

export const getCustomer= async (id:UUID) : Promise<ApiResponse<Customer>> => {
    const apiClient = new ApiClient();
    const authToken = await getAuthToken();
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
    const customerResponse = await apiClient.post(
        `/api/customers/${location?.id}`,
        query,
    );
    
    return parseStringify(customerResponse)
}

export const updateCustomer = async(
    id:UUID,
    customer: z.infer<typeof CustomerSchema>

):Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const customerValidData= CustomerSchema.safeParse(customer)

    console.log("Updated Customer Valid Data", customerValidData)

    if (!customerValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(customerValidData.error.message)
      }
      return parseStringify(formResponse)
    }
    const location = await getCurrentLocation();
    const payload = {
        ...customerValidData.data,
        location: location?.id
    }
    try {
        const apiClient = new ApiClient();

       

        const updatedCustomer = await apiClient.put(
            `api/customers/${location?.id}/${id}`,
            payload
        );
      
    }
    catch (error){
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
    revalidatePath("/customers");
    redirect("/customers")
}

export const deleteCustomer = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Customer ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/customers/${location?.id}/${id}`,
    );
    revalidatePath("/customers");
    
   }
   catch (error){
       throw error
   }
}
