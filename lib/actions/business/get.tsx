"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {endpoints} from "@/types/endpoints";
import {Business} from "@/types/business/type";
import {getAuthToken} from "@/lib/auth-utils";
import {UUID} from "node:crypto";

export const getBusiness = async (id: UUID): Promise<Business> => {
    const apiClient = new ApiClient();
    const authToken = await getAuthToken();
    const userId = authToken?.id;
    const myEndpoints = endpoints({userId: userId, id: id});
    const data = await apiClient.get(myEndpoints.business.get.endpoint);

    return parseStringify(data);
};
