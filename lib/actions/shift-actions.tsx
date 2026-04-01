"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import { getCurrentBusiness, getCurrentLocation } from "./business/get-current-business";
import { Shift } from "@/types/shift/type";
import { ShiftSchema } from "@/types/shift/schema";

export const fectchAllShifts = async () : Promise<Shift[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const shiftData= await  apiClient.get(
            `/api/v1/shifts/templates`,
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
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        params.set("page", String(page ? page - 1 : 0));
        params.set("size", String(pageLimit ? pageLimit : 10));

        const shiftData = await  apiClient.get(
            `/api/v1/shifts/templates?${params.toString()}`,
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
            `/api/v1/shifts/templates`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Shift created successfully",
        };
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

    revalidatePath("/shifts");
    return parseStringify(formResponse)

}

export const getShift= async (id:UUID) : Promise<ApiResponse<Shift>> => {
    const apiClient = new ApiClient();

    const shift= await apiClient.get(
        `/api/v1/shifts/templates/${id}`,
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

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/v1/shifts/templates/${id}`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Shift updated successfully",
        };

    } catch (error) {
        console.error("Error while updating shift", error);
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/shifts");
    return parseStringify(formResponse);

};

export const deleteShift = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Shift ID is required to perform this request");

    await getAuthenticatedUser();

   try{
    const apiClient = new ApiClient();

    await apiClient.delete(
        `/api/v1/shifts/templates/${id}`,
    );
    revalidatePath("/shifts");

   }
   catch (error){
       throw error
   }
}
