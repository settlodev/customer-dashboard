"use server";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationSchema } from "@/types/location/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { cookies } from "next/headers";
import { z } from "zod";
import { Location } from "@/types/location/type";
import { refreshLocation } from "../business/refresh";
import {signOut} from "@/auth";

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

        if (typeof response) {

            const token = cookies().get("authToken")?.value;
            if (token) {
                const authToken = JSON.parse(token) as AuthToken;

                authToken.locationComplete = true;
                cookies().set("authToken", JSON.stringify(authToken), { path: "/", httpOnly: true });

                // This redirects to dashboard automatically
                await refreshLocation(response as Location);
            } else {
                formResponse = {
                    responseType:"error",
                    message:"Something went wrong while processing your request, please try again",
                    error : new Error("Invalid token!")
                }

                // Logout since auth token was not found
                await signOut();
            }

        } else {
            console.error("Unexpected response:", response);
            formResponse = {
                responseType:"error",
                message:"Something went wrong while processing your request, please try again",
                error : new Error("Could not parse response from server!")
            }
        }
    } catch (error) {
        console.log("parse", parseStringify(error))
        formResponse = {
            responseType:"error",
            message:"Something went wrong while processing your request, please try again",
            error : error instanceof Error ? error : new Error(String(error))
        }
        return parseStringify(formResponse)
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

