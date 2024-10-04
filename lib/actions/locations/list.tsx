"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {endpoints} from "@/types/endpoints";
import {Business} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {UUID} from "node:crypto";

export const listLocations = async (
    q: string,
    page: number,
    pageLimit: number
): Promise<ApiResponse<Business>> => {
    //await getAuthenticatedUser();

    const authToken = await getAuthToken();

    const userId = authToken?.id;
    //console.log("userId is:", userId)
    //const authToken = await getAuthToken();
    const myEndpoints = endpoints({businessId: userId});
    try {
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "name",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
            ],
            sorts: [
                {
                    key: "name",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10
        };

        const data = await apiClient.post(myEndpoints.business.list.endpoint, query);
        //console.log("Action response", data);

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};
