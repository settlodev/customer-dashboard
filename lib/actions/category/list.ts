"use server"

import {ApiResponse} from "@/types/types";
import {Staff} from "@/types/staff";
import {getAuthenticatedUser} from "@/lib/actions/auth-actions";
import {getAuthToken} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {endpoints} from "@/types/endpoints";

export const list = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Staff>> => {
    await getAuthenticatedUser();

    const authToken = await getAuthToken();

    try {
        const apiClient = new ApiClient();

        const query = {
            // filters: [
            //     {
            //         key: "name",
            //         operator: "LIKE",
            //         field_type: "STRING",
            //         value: q,
            //     },
            // ],
            sorts: [
                {
                    key: "name",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };

        const myEndpoints = endpoints(authToken?.locationId)

        const data = await apiClient.post(
            myEndpoints.categories.search.endpoint,
            query,
        );

        console.log("Action response", data);

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};
