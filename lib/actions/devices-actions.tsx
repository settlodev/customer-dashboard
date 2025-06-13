"use server";
import { ApiResponse} from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { Device } from "@/types/device/type";



export const searchDevices = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Device>> => {
    await getAuthenticatedUser();

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
            size: pageLimit ? pageLimit : 10,
        };

        const location = await getCurrentLocation();

        const deviceResponse = await apiClient.post(
            `/api/location-devices/${location?.id}`,
            query,
        );


        return parseStringify(deviceResponse);
    } catch (error) {
        throw error;
    }
};





