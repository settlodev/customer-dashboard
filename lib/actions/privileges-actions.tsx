"use server";

import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, PrivilegeItem, WarehousePrivilegeItem} from "@/types/types";

export const fetchAllSections = async () : Promise<PrivilegeItem[]> => {
    try {
        const apiClient = new ApiClient();

        const data = await  apiClient.get(
            `/api/v1/permissions`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}

export const searchWarehousePrivilegesSection = async():Promise<ApiResponse<WarehousePrivilegeItem[]>>  =>{
    try {
        const apiClient = new ApiClient();

        const params = new URLSearchParams();
        params.set("category", "warehouse");
        params.set("page", "0");
        params.set("size", "10");

        const data = await  apiClient.get(
            `/api/v1/permissions?${params.toString()}`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
