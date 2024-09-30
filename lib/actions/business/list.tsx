"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {endpoints} from "@/types/endpoints";
import {cookies} from "next/headers";
import {BusinessType} from "@/types/business/type";

export const listBusinesses = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<BusinessType>> => {
    //await getAuthenticatedUser();

    const location = cookies().get('businessId')?.value;
    console.log("location is:", location)
    //const authToken = await getAuthToken();
    const myEndpoints = endpoints({location: location});
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

        const data = await apiClient.post(myEndpoints.business.search.endpoint, query);

        console.log("Action response", data);

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};
