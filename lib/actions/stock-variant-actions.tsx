"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import { getCurrentLocation } from "./business/get-current-business";
import { StockMovement, StockVariant } from "@/types/stockVariant/type";

export const fetchStockVariants = async (stockId: string) : Promise<StockVariant[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const data = await  apiClient.get(
            `/api/stock-variants/${stockId}`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}

export const searchStockVariants = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockVariant>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"name",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/stock-variants/${location?.id}/all`,
            query
        );

        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}

export const getStockVariantMovement= async (id:UUID) : Promise<StockMovement[]>=> {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const data: StockMovement[] = await apiClient.get<StockMovement[]>(
            `/api/stock-movements/${id}`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}

