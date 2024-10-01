import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationSchema } from "@/types/location/schema";
import { FormResponse } from "@/types/types";
import { redirect } from "next/navigation";
import { z } from "zod";

export const createBusinessLocation = async (
    businessLocation: z.infer<typeof LocationSchema>
):Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const businessLocationValidData = LocationSchema.safeParse(businessLocation)

    if(!businessLocationValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(businessLocationValidData.error.message)
      }
      return parseStringify(formResponse)
    }
    try {
        const apiClient = new ApiClient();
        const business= await getAuthenticatedUser();
        const businessId= business?.businessId

        const payload = {
            ...businessLocationValidData.data
        }

        await apiClient.post(
            `/api/businesses/${businessId}/create`,
            payload
        );
        if(formResponse){
            return parseStringify(formResponse)
        }
        redirect("/dashboard");
    } catch (error) {
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        };
        return parseStringify(formResponse);
    }
}