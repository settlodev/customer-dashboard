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


const isAuthError = (error: any): boolean => {
    return error?.status === 401 || 
           error?.status === 403 || 
           error?.message?.toLowerCase().includes('auth') ||
           error?.message?.toLowerCase().includes('token');
};

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
    try {
        // Check for existing business cookie
        const cookieStore = await cookies();
        const businessCookie = cookieStore.get("currentBusiness");

        // If cookie exists, try to parse it
        if (businessCookie) {
            try {
                const parsedBusiness = JSON.parse(businessCookie.value) as Business;
                
                
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
            
            return undefined;
        }

        const currentBusiness = await getBusiness(currentLocation.business);

        if (!currentBusiness) {
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

       
        if (!authToken) {
            if (retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return getBusinessDropDown(retryCount + 1);
            }
            console.log("No auth token found, redirecting to login");
            return null;
        }

        const userId = authToken?.id as UUID;
        
        if (!userId) {
            console.log("Invalid user ID in auth token, redirecting to login");
            return null;
        }

        const myEndpoints = endpoints({ userId: userId });
        const apiClient = new ApiClient();

        try {
            const data = await apiClient.get(myEndpoints.business.list.endpoint);
            return parseStringify(data);
        } catch (apiError: any) {
            
            if (apiError.status === 401 || apiError.status === 403) {
                console.error("Authentication/authorization failed, redirecting to login");
                return null;
            }

            
            if (retryCount < MAX_RETRIES && (
                apiError.status >= 500 || 
                apiError.code === 'NETWORK_ERROR' ||
                apiError.name === 'NetworkError'
            )) {
                console.log(`Server/network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return getBusinessDropDown(retryCount + 1);
            }

            // For other client errors (4xx), don't retry
            console.error("API request failed:", apiError);
            throw apiError;
        }
    } catch (error) {

        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
          }

        console.error("Failed to get business list:", error);

        
        if (retryCount < MAX_RETRIES && !isAuthError(error)) {
            console.log(`Unexpected error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return getBusinessDropDown(retryCount + 1);
        }

        return null;
    }
};
