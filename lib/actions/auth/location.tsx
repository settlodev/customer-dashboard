"use server";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationSchema } from "@/types/location/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Location } from "@/types/location/type";
import { refreshLocation } from "../business/refresh";

export const createBusinessLocation = async (
    businessLocation: z.infer<typeof LocationSchema>
):Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    let success: boolean = false;
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
        
        const activeBusiness = cookies().get("activeBusiness")?.value;
        const business = JSON.parse(activeBusiness as string);
        const businessId= business.Business.id;

        const payload = {
            ...businessLocationValidData.data,
            business: businessId,
            
        }


       const response = await apiClient.post(
            `/api/locations/${businessId}/create`,
            payload
        );

        console.log("response of location",response)

        if (typeof response) {
           
            const token = cookies().get("authToken")?.value;
            if (token) {
                const authToken = JSON.parse(token) as AuthToken;
        
                authToken.locationComplete = true;
              
        
                cookies().set("authToken", JSON.stringify(authToken), { path: "/", httpOnly: true });
        

                success = true;

                if(success){
                    cookies().delete("activeLocation");

                    cookies().set("activeLocation", JSON.stringify({locationId:response}), { path: "/", httpOnly: true });

                    refreshLocation(response as Location);
                }
        
            } else {
                console.log("No token found");
            }

        } else {
            console.log("Unexpected response:", response);
        }
        console.log("location created")
    } catch (error) {
        console.log("parse", parseStringify(error))
        formResponse = {
            responseType:"error",
            message:"Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        }
        return parseStringify(formResponse)
    }
    if(success){
        redirect("/dashboard");
    }
}

export const getAllBusinessLocationsByBusinessID = async (
    businessId: string
): Promise<Location[]> => {
    const apiClient = new ApiClient();
    try {
        const response = await apiClient.get(
            `/api/locations/${businessId}`
        );
        console.log("The response from the API for locations is:", response);
        return parseStringify(response);
        
    } catch (error) {
        return parseStringify({
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
}

