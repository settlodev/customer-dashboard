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
import { Shift } from "@/types/shift/type";
import { ShiftSchema } from "@/types/shift/schema";

export const fectchAllShifts = async () : Promise<Shift[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const shiftData= await  apiClient.get(
            `/api/shifts/${location?.id}`,
        );

        console.log("All shifts", shiftData);
       
        return parseStringify(shiftData);

    }
    catch (error){
        throw error;
    }
}
export const searchShift = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Shift>> =>{
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
        const shiftData = await  apiClient.post(
            `/api/shifts/${location?.id}`,
            query
        );
        return parseStringify(shiftData);
    }
    catch (error){
        throw error;
    }

}
export const  createShift= async (
    shift: z.infer<typeof ShiftSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validShiftData= ShiftSchema.safeParse(shift)

    console.log("Valid shift data",validShiftData);


    if (!validShiftData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(validShiftData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...validShiftData.data,
        location: location?.id,
        business: business?.id
    }

    console.log("The payload to create shift", payload);

    try {
        const apiClient = new ApiClient();
      

        await apiClient.post(
            `/api/shifts/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error while creating shift",error)
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
    revalidatePath("/shifts");
    redirect("/shifts")
}

export const getShift= async (id:UUID) : Promise<ApiResponse<Shift>> => {
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
    const shift= await apiClient.post(
        `/api/shifts/${location?.id}`,
        query,
    );
    
    return parseStringify(shift)
}



export const updateShift = async (
    id: UUID,
    shift: z.infer<typeof ShiftSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validShiftData = ShiftSchema.safeParse(shift);

    if (!validShiftData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validShiftData.error.message),
        };
        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const business = await getCurrentBusiness();

    const payload = {
        ...validShiftData.data,
        location: location?.id,
        business: business?.id
    };
    console.log("updating the shift id", id);
    console.log("The payload to update shift", payload);

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/shifts/${location?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error while updating shift", error); 
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
    revalidatePath("/shifts");
    redirect("/shifts");
};

export const deleteShift = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Shift ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    const location = await getCurrentLocation();
   
    await apiClient.delete(
        `/api/shifts/${location?.id}/${id}`,
    );
    revalidatePath("/brands");
    
   }
   catch (error){
       throw error
   }
}
