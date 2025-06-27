"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { StockMovement } from "@/types/stock-movement/type";

export const fetchStockMovements = async () : Promise<StockMovement[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock-movements/${location?.id}/all`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
export const searchStockMovement = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockMovement>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"StockName",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"stockName",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/stock-movements/${location?.id}`,
            query
        );
        
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}


export const getStockMovement= async (id:UUID) : Promise<ApiResponse<StockMovement>> => {

    const apiClient = new ApiClient();
    const query ={
        filters:[
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            }
        ],
        sorts: [],
        page: 0,
        size: 1,
    }
    const location = await getCurrentLocation();
    const response = await apiClient.post(
        `/api/stock-intakes/${location?.id}/${id}`,
        query,
    );

    return parseStringify(response)
}



