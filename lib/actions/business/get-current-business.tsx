"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business, BusinessWithLocationType} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {endpoints} from "@/types/endpoints";
import ApiClient from "@/lib/settlo-api-client";
import {UUID} from "node:crypto";
import {Location} from "@/types/location/type";

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
    const businessCookie = cookies().get("currentBusiness");
    if (!businessCookie) return undefined;

    try {
        return JSON.parse(businessCookie.value) as Business;
    } catch (error) {
        console.error("Failed to parse business cookie:", error);
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
        //console.log("Business Drop Down response", data);

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
