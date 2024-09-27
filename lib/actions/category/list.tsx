"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {Staff} from "@/types/staff";
import {endpoints} from "@/types/endpoints";

export const listCategories = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Staff>> => {
    //await getAuthenticatedUser();

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
            size: pageLimit ? pageLimit : 10,
        };

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
