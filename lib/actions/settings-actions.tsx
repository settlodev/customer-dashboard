"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { LocationSettings} from "@/types/locationSettings/type";
import { LocationSettingsSchema } from "@/types/locationSettings/schema";

export const fetchLocationSettings = async () : Promise<LocationSettings> => {
    await  getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const settingsData = await  apiClient.get(
            `/api/location-settings/${location?.id}`,
        );

        return parseStringify(settingsData);

    }
    catch (error){
        throw error;
    }
}


export const updateLocationSettings = async (
    id: UUID,
    setting: z.infer<typeof LocationSettingsSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const validSettingsData = LocationSettingsSchema.safeParse(setting);

    console.log("Valid settings are:", validSettingsData);
    console.log("location settings id:", id);

    if (!validSettingsData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validSettingsData.error.message),
        };
        return parseStringify(formResponse);
    }

    const locationId = await getCurrentLocation();
    const payload = {
        ...validSettingsData.data,
        locationId: locationId?.id,
    };

    try {
        const apiClient = new ApiClient();

        await apiClient.put(
            `/api/location-settings/${locationId?.id}/${id}`, 
            payload
        );

    } catch (error) {
        console.error("Error updating location settings", error); 
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }
    revalidatePath("/settings");
    redirect("/settings");
};


