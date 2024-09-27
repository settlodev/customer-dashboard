"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {endpoints} from "@/types/endpoints";

export const listCategories = async (businessId: string | undefined) => {
    try {
        const apiClient = new ApiClient();

        const myEndpoints = endpoints(businessId);

        const data = await apiClient.get(myEndpoints.categories.list.endpoint);

        console.log("Action response", data);

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};
