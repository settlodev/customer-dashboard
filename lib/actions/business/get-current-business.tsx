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
        const cookieStore = await cookies();
        const businessCookie = cookieStore.get("currentBusiness");

        // If cookie exists, try to parse it
        if (businessCookie) {
            try {
                const parsedBusiness = JSON.parse(businessCookie.value) as Business;
                // console.log('Successfully parsed business from cookie');
                
                return parsedBusiness;
            } catch (error) {
                console.error('Failed to parse business cookie:', error);
                cookieStore.delete("currentBusiness");
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
    const cookieStore = await cookies();
    const locationCookie = cookieStore.get("currentLocation");
   
    if (!locationCookie) return undefined;

    try {
        return JSON.parse(locationCookie.value) as Location;
    } catch (error) {
        console.error("Failed to parse location cookie:", error);
        return undefined;
    }
};



export const getBusinessDropDown = async (retryCount = 0): Promise<Business[] | null> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; 

    try {
        const authToken = await getAuthToken();

        // If no auth token and we haven't exceeded retries, wait and try again
        if (!authToken && retryCount < MAX_RETRIES) {
            console.log(`Auth token not found, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getBusinessDropDown(retryCount + 1);
        }

        if (!authToken) {
            console.error("No auth token found after max retries");
            return null;
        }

        const userId = authToken?.id as UUID;
        
        // Additional validation
        if (!userId) {
            console.error("User ID not found in auth token");
            return null;
        }

        // console.log(`Fetching business for userId: ${userId}`);
        
        const myEndpoints = endpoints({userId: userId});
        const apiClient = new ApiClient();

        try {
            const data = await apiClient.get(myEndpoints.business.list.endpoint);
            // console.log(`Successfully fetched ${data?.length || 0} businesses`);
            return parseStringify(data);
        } catch (apiError: any) {
            // Check for specific API errors
            if (apiError.status === 403 && apiError.code === 'FORBIDDEN') {
                console.error("API authentication failed:", apiError.message);
                return null;
            }

            // If it's a temporary error and we haven't exceeded retries, try again
            if (retryCount < MAX_RETRIES && (apiError.status >= 500 || apiError.code === 'NETWORK_ERROR')) {
                // console.log(`API error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return getBusinessDropDown(retryCount + 1);
            }

            // console.error("API request failed:", apiError);
            throw apiError;
        }
    } catch (error) {
        console.error("Failed to get business list:", error);

        
        if (retryCount < MAX_RETRIES) {
            // console.log(`General error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getBusinessDropDown(retryCount + 1);
        }

        return null;
    }
}