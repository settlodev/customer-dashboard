"use server";

import ApiClient from "@/lib/settlo-api-client";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, PrivilegeItem, WarehousePrivilegeItem} from "@/types/types";

export const fetchAllSections = async () : Promise<PrivilegeItem[]> => {
    try {
        const apiClient = new ApiClient();

        const data = await  apiClient.get(
            `/api/privilege-sections`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}

export const searchWarehousePrivilegesSection = async():Promise<ApiResponse<WarehousePrivilegeItem[]>>  =>{
    const page =0;
    const size = 10;
    try {
        const apiClient = new ApiClient();
        const query ={
            page,
            size
        }

        const data = await  apiClient.post(
            `/api/warehouse-privilege-sections`,query,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
