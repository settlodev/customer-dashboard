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
import { Email } from "@/types/email/type";
import { EmailSchema } from "@/types/email/schema";

export const fectchEmails = async () : Promise<Email[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const emailData = await  apiClient.get(
            `/api/broadcast-email/${location?.id}`,
        );

        return parseStringify(emailData);

    }
    catch (error){
        throw error;
    }
}
export const searchEmail = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Email>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"subject",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"subject",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();

        const emailData = await  apiClient.post(
            `/api/broadcast-email/${location?.id}`,
            query
        );
        return parseStringify(emailData);
    }
    catch (error){
        throw error;
    }

}
export const  sendEmail= async (
    email: z.infer<typeof EmailSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const ValidEmailData= EmailSchema.safeParse(email)

    if (!ValidEmailData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(ValidEmailData.error.message)
      }
      return parseStringify(formResponse)
    }

    const location = await getCurrentLocation();
    console.log("The location id passed is", location?.id);
     

    const payload = {
        ...ValidEmailData.data,
        location: location?.id,
    }

    console.log("The payload sending sms", payload);
    try {
        const apiClient = new ApiClient();


        await apiClient.post(
            `/api/broadcast-email/${location?.id}/create`,
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
    revalidatePath("/email-marketing");
    redirect("/email-marketing");
}

export const getEmail= async (id:UUID) : Promise<ApiResponse<Email>> => {
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
    const emailResponse = await apiClient.post(
        `/api/broadcast-email/${location?.id}`,
        query,
    );

    return parseStringify(emailResponse);
}

