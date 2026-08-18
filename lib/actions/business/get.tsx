"use server"
import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {Business} from "@/types/business/type";
type UUID = string;
import {ApiResponse} from "@/types/types";

export const getBusiness = async (id: UUID): Promise<ApiResponse<Business>> => {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`/api/v1/businesses/${id}`);

    return parseStringify(data);
};
