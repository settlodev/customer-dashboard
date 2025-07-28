"use server";



import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse} from "@/types/types";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import { Warehouses } from "@/types/warehouse/warehouse/type";
import { getCurrentWarehouse } from "./current-warehouse-action";

export const getWarehouse = async (
    id?:string
): Promise<Warehouses | null> => {
    try {
        const business = await getCurrentBusiness();

        if (!business) {
            return null;
        }

        const apiClient = new ApiClient();
        const warehouse = id ? { id } : await getCurrentWarehouse();

        const warehousesData = await apiClient.get(
            `/api/warehouses/${business.id}/${warehouse?.id}`,
        );

        return parseStringify(warehousesData);
    } catch (error) {
        
        console.error('Error in getWarehouses:', error);
        throw error;
    }
};

export const searchWarehouses = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Warehouses>> => {
    await getAuthenticatedUser();

    try {
        const business = await getCurrentBusiness();
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "name",
                    operator: "LIKE",
                    field_type: "UUID_STRING",
                    value: q,
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
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


        const data = await apiClient.post(
            `/api/warehouses/${business?.id}`,
            query,
        );
       
        return parseStringify(data);

    } catch (error) {
        console.error('Error in search warehouses:', error);
        throw error;
    }
};



