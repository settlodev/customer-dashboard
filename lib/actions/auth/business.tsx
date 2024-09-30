"use server"
import {getAuthToken} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { BusinessSchema } from "@/types/business/schema";
import { FormResponse } from "@/types/types";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { redirect } from "next/navigation";

export const createBusiness = async(
    business:z.infer<typeof BusinessSchema>
):Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const businessValidData = BusinessSchema.safeParse(business)

    if (!businessValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(businessValidData.error.message)
      }
      return formResponse
    }
    try {
         const apiClient = new ApiClient();
        const user= await getAuthToken();
        const userId= user?.id

        const payload = {
            ...businessValidData.data
        }

        await apiClient.post(
            `/api/businesses/${userId}/create`,
            payload
        );
        if(formResponse){
            return parseStringify(formResponse)
        }

        redirect("/location")
    }
    catch (error){
        console.error("Error creating business",error)
        formResponse = {
            responseType:"error",
            message:"Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        }
        return parseStringify(formResponse)
    }
}
