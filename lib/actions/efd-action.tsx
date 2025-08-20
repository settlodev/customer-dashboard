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
        provider:provider
    };


    try {
        const apiClient = new ApiClient();

       const response = await apiClient.post(
            `/api/vfd/${location?.id}/onboard`,
            payload
        );

        return parseStringify(response);
       
    } catch (error: unknown) {
        console.log("Failed to onboard business for TIN",error)
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/settings");
};