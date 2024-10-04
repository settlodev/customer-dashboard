"use server"

import {parseStringify} from "@/lib/utils";
import {cookies} from "next/headers";
import {Business} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {endpoints} from "@/types/endpoints";
import ApiClient from "@/lib/settlo-api-client";
import {UUID} from "node:crypto";

export const getCurrentBusiness = async (): Promise<string | undefined> => {
    return cookies().get("currentBusiness")?.value;
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
