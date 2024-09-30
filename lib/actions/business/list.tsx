"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {endpoints} from "@/types/endpoints";
import {Business} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";

export const listBusinesses = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Business>> => {
    //await getAuthenticatedUser();

    const authToken = await getAuthToken();

    console.log("authToken user:", authToken);
    const location = authToken?.businessId;
    console.log("location is:", location)
    //const authToken = await getAuthToken();
    const myEndpoints = endpoints();
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
            size: pageLimit ? pageLimit : 10
        };

        console.log("myEndpoints.business.search.endpoint", myEndpoints.business.list.endpoint);

        const data = await apiClient.get(myEndpoints.business.list.endpoint);
        console.log("Action response", data);

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};
