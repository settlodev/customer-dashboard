'use server'

import { efdSettingsSchema } from "@/types/efd/schema";
import { FormResponse } from "@/types/types";
import z from "zod";
import { parseStringify } from "../utils";
import { getCurrentLocation } from "./business/get-current-business";
import ApiClient from "../settlo-api-client";
import { revalidatePath } from "next/cache";

export const RequestEfd = async (
    efd: z.infer<typeof efdSettingsSchema>,
): Promise<FormResponse | any> => {
    let formResponse: FormResponse | null = null;
   
    const provider = "DIRM_VFD"
    
    const validatedEfdData = efdSettingsSchema.safeParse(efd);

    if (!validatedEfdData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedEfdData.error.message),
        };

        return parseStringify(formResponse);
    }

    const location = await getCurrentLocation();
    const payload = {
        ...validatedEfdData.data,
        provider: provider
    };

    try {
        const apiClient = new ApiClient();

        const response = await apiClient.post(
            `/api/vfd/${location?.id}/onboard`,
            payload
        );

        return parseStringify(response);
       
    } catch (error: unknown) {
        console.log("Failed to onboard business for EFD", error)
        formResponse = {
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
        
        return parseStringify(formResponse);
    } finally {
        revalidatePath("/settings");
    }
};

export const EfdStatus = async () => {
    let formResponse: FormResponse | null = null;
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    
    try {
        const status = await apiClient.get(
            `/api/vfd/${location?.id}/status`,
        );

        return parseStringify(status);

    } catch (error: unknown) {
        console.error("Failed to fetch EFD status:", error);
        
        formResponse = {
            responseType: "error",
            message: "Something went wrong while disabling EFD, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
        return parseStringify(formResponse);
    }
}

export const UpdateEfdStatus = async () => {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    
    try {
        const status = await apiClient.post(
            `/api/vfd/${location?.id}/refresh-status`,{}
        );
        
        revalidatePath("/settings");
        return parseStringify(status);

    } catch (error: unknown) {
        console.error("Failed to update EFD status:", error);
        throw error;
    }
}

// Optional: Function to disable/remove EFD for a location
export const DisableEfd = async (): Promise<FormResponse | any> => {
    let formResponse: FormResponse | null = null;
    const location = await getCurrentLocation();

    try {
        const apiClient = new ApiClient();

        const response = await apiClient.post(
            `/api/vfd/${location?.id}/disable`,
            {}
        );

        return parseStringify(response);
       
    } catch (error: unknown) {
        console.log("Failed to disable EFD for business", error)
        formResponse = {
            responseType: "error",
            message: "Something went wrong while disabling EFD, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
        
        return parseStringify(formResponse);
    } finally {
        revalidatePath("/settings");
    }
};