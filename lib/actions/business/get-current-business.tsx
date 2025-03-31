"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {endpoints} from "@/types/endpoints";
import ApiClient from "@/lib/settlo-api-client";
import {UUID} from "node:crypto";
import {Location} from "@/types/location/type";
import {getBusiness} from "@/lib/actions/business/get";

import {redirect} from "next/navigation";
import { signOut } from "next-auth/react";

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
    try {
        // Check for existing business cookie
        const businessCookie = cookies().get("currentBusiness");

        // If cookie exists, try to parse it
        if (businessCookie) {
            try {
                const parsedBusiness = JSON.parse(businessCookie.value) as Business;
                console.log('Successfully parsed business from cookie');
                
                return parsedBusiness;
            } catch (error) {
                console.error('Failed to parse business cookie:', error);
                cookies().delete("currentBusiness");
            }
        }

        // No cookie or invalid cookie, fetch fresh data
        // console.log('Fetching fresh business data...');
        const currentLocation = await getCurrentLocation();

        if (!currentLocation) {
            // console.warn('getCurrentLocation returned undefined');
            return undefined;
        }

        if (!currentLocation.business) {
            // console.warn('No business ID found in current location');
            return undefined;
        }

        // console.log('Attempting to get business with ID:', currentLocation.business);
        const currentBusiness = await getBusiness(currentLocation.business);
        console.log('getBusiness returned data');

        if (!currentBusiness) {
            // console.warn('No business found for ID:', currentLocation.business);
            return undefined;
        }

        return parseStringify(currentBusiness);
    } catch (error) {
        console.error('Error in getting current business - logging out :', error);

        await signOut();

        redirect("/login")
    }
};

export const getCurrentLocation = async (): Promise<Location | undefined> => {
    const locationCookie = cookies().get("currentLocation");
    if (!locationCookie) return undefined;

    try {
        return JSON.parse(locationCookie.value) as Location;
    } catch (error) {
        console.error("Failed to parse location cookie:", error);
        return undefined;
    }
};

export const getBusinessDropDown = async (): Promise<Business[] | null> => {
    try {
        const authToken = await getAuthToken();

        const userId = authToken?.id as UUID;
        const myEndpoints = endpoints({userId: userId});

        const apiClient = new ApiClient();

        try {
            const data = await apiClient.get(myEndpoints.business.list.endpoint);
            return parseStringify(data);
        } catch (apiError: any) {
            // Check for specific API errors
            if (apiError.status === 403 && apiError.code === 'FORBIDDEN') {
                console.error("API authentication failed:", apiError.message);
                return null;
            }

            console.error("API request failed:", apiError);
            throw apiError;
        }
    } catch (error) {
        console.error("Failed to get business list:", error);

        // await signOut();
        return null;
    }
}
