"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { SMS } from "@/types/sms/type";
import { SMSSchema } from "@/types/sms/schema";

export const fectchSMS = async () : Promise<SMS[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const smsData = await  apiClient.get(
            `/api/broadcast-sms/${location?.id}`,
        );

        return parseStringify(smsData);

    }
    catch (error){
        throw error;
    }
}
export const searchSMS = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<SMS>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"senderId",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"senderId",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();

        const smsData = await  apiClient.post(
            `/api/broadcast-sms/${location?.id}`,
            query
        );
        return parseStringify(smsData);
    }
    catch (error){
        throw error;
    }

}
export const  sendSMS= async (
    sms: z.infer<typeof SMSSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const ValidSmsData= SMSSchema.safeParse(sms)

    if (!ValidSmsData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(ValidSmsData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    console.log("The location id passed is", location?.id);
     

    const payload = {
        ...ValidSmsData.data,
        location: location?.id,
    }

    console.log("The payload sending sms", payload);
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/broadcast-sms/${location?.id}/create`,
            payload
        );
    }
    catch (error){
        console.error("Error sending sms",error)
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
    revalidatePath("/sms-marketing");
    redirect("/sms-marketing");
}

export const getSMS= async (id:UUID) : Promise<ApiResponse<SMS>> => {
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
    const smsResponse = await apiClient.post(
        `/api/broadcast-sms/${location?.id}`,
        query,
    );

    return parseStringify(smsResponse);
}

