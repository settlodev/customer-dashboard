"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business, BusinessWithLocationType} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {endpoints} from "@/types/endpoints";
import ApiClient from "@/lib/settlo-api-client";
import {UUID} from "node:crypto";
import {Location} from "@/types/location/type";
import {getBusiness} from "@/lib/actions/business/get";

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
    console.log('🏢 Starting getCurrentBusiness...');

    try {
        // Check for existing business cookie
        const businessCookie = cookies().get("currentBusiness");
        console.log('🍪 Business cookie status:', businessCookie ? 'found' : 'not found');

        // If cookie exists, try to parse it
        if (businessCookie) {
            try {
                const parsedBusiness = JSON.parse(businessCookie.value) as Business;
                console.log('✅ Successfully retrieved business from cookie');
                return parsedBusiness;
            } catch (error) {
                console.error('❌ Failed to parse business cookie:', error);
                // Remove invalid cookie
                cookies().delete("currentBusiness");
            }
        }

        // No cookie or invalid cookie, fetch fresh data
        console.log('🔄 Fetching fresh business data...');
        const currentLocation = await getCurrentLocation();

        if (!currentLocation?.business) {
            console.warn('⚠️ No business ID found in current location');
            return undefined;
        }

        const currentBusiness = await getBusiness(currentLocation.business);

        if (!currentBusiness) {
            console.warn('⚠️ No business found for ID:', currentLocation.business);
            return undefined;
        }

        // Set new cookie with business data
        try {
            cookies().set("currentBusiness", JSON.stringify(currentBusiness), {
                path: "/",
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });
            console.log('✅ Successfully set new business cookie');
        } catch (error) {
            console.error('❌ Failed to set business cookie:', error);
            // Continue without setting cookie
        }

        return parseStringify(currentBusiness);
    } catch (error) {
        console.error('❌ Error in getCurrentBusiness:', error);
        return undefined;
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
export const setCurrentLocation = async (location: Location): Promise<Location> => {
    cookies().set({name: "currentLocation", value: JSON.stringify(location)});
    return location;
};

export const getBusinessDropDown = async (): Promise<Business[]> => {
    const authToken = await getAuthToken();

    const userId = authToken?.id as UUID;
    const myEndpoints = endpoints({userId: userId});
    try {
        const apiClient = new ApiClient();

        const data = await apiClient.get(myEndpoints.business.list.endpoint);
        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};

export const getBusinessWithLocations = async (): Promise<BusinessWithLocationType[]> => {
    const authToken = await getAuthToken();

    const userId = authToken?.id as UUID;
    const myEndpoints = endpoints({userId: userId});
    try {
        const apiClient = new ApiClient();

        const data = await apiClient.get(myEndpoints.business.list.endpoint);
        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const getLocations = async (businessId: UUID): Promise<Location[]> => {
    const myEndpoints = endpoints({businessId: businessId});
    const apiClient = new ApiClient();
    const data = await apiClient.get(myEndpoints.locations.list.endpoint);
    return parseStringify(data);
}
