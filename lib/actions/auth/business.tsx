import { getAuthToken } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { BusinessSchema } from "@/types/business/schema";
import { FormResponse } from "@/types/types";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";

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
        // const authToken = await getAuthToken();

        // const response = await apiClient.post(
        //     `api/businesses`,
        //     businessValidData.data
        // );

        // console.log(response);

        // formResponse={
        //     responseType:"success",
        //     message:"Business created successfully"
        // }

        // return formResponse
    }
    catch (error){
        console.error("Error creating business",error)
        formResponse = {
            responseType:"error",
            message:"Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        }
        return formResponse
    }
}
