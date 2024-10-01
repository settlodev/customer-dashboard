"use server"
import {getAuthToken} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import { BusinessSchema } from "@/types/business/schema";
import { activeBusiness, AuthToken, FormResponse } from "@/types/types";
import { z } from "zod";
import ApiClient from "@/lib/settlo-api-client";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";

export const createBusiness = async(
    business:z.infer<typeof BusinessSchema>
):Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    let success: boolean = false;
    const businessValidData = BusinessSchema.safeParse(business)

    if (!businessValidData.success){
        formResponse = {
            responseType:"error",
            message:"Please fill all the required fields",
            error:new Error(businessValidData.error.message)
      }
      return parseStringify(formResponse)
    }
    try {
         const apiClient = new ApiClient();
        const user= await getAuthToken();
        const userId= user?.id

        const payload = {
            ...businessValidData.data,
            user: userId
        }
        console.log("payload",payload)

        let response =await apiClient.post(
            `/api/businesses/${userId}/create`,
            payload
        );
        
        if (typeof response) {
           
            const token = cookies().get("authToken")?.value;
            if (token) {
                const authToken = JSON.parse(token) as AuthToken;
        
                authToken.businessComplete = true;
                // authToken.businessId = response;
        
                // console.log("Updated auth token", authToken);
        
                cookies().set("authToken", JSON.stringify(authToken), { path: "/", httpOnly: true });
        
                const updatedToken = cookies().get("authToken")?.value;
                // console.log("Updated token is:", updatedToken);

                success = true;

                if(success){
                    // first delete the active business cookie if it exists
                    cookies().delete("activeBusiness");

                    // set the active business cookie
                    cookies().set("activeBusiness", JSON.stringify({businessId:response}), { path: "/", httpOnly: true });

                    const activeBusiness = cookies().get("activeBusiness")?.value;
                    console.log("Active business is:", activeBusiness);
                }
        
            } else {
                console.log("No token found");
            }

        } else {
            console.log("Unexpected response:", response);
        }
        

        console.log("business created")
       
    }
    catch (error){
        if(isRedirectError(error)) throw error;

        console.error("Error creating business",error)
        formResponse = {
            responseType:"error",
            message:"Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        }
        return parseStringify(formResponse)
    }

    if (success) {
        redirect("/business-location");
    }
}

export const fetchCountries = async () => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get("/api/countries");
        return parseStringify(response);
    } catch (error) {
        throw error;
    }   
}
