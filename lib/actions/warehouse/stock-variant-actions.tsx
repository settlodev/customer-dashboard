'use server'
import { getAuthenticatedUser } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StockMovement, StockVariant, stockVariantSummary } from "@/types/stockVariant/type";
import { ApiResponse } from "@/types/types";
import { UUID } from "crypto";
import { getCurrentWarehouse } from "./current-warehouse-action";

export const searchStockVariantsInWarehouse = async (
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
                    key:"stock.name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q,
                    isArchived:false
                },
                {
                    key:"isArchived",
                    operator:"EQUAL",
                    field_type:"BOOLEAN",
                    value:false
                }
            ],
            sorts:[
                {
                    key:"dateCreated",
                    direction:"DESC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const warehouse = await getCurrentWarehouse();
        // const warehouse = '489c1834-ce9c-4da7-839e-5d8d75ca7f4f'
        const data = await  apiClient.post(
            `/api/stock-variants/${warehouse?.id}/all-with-warehouse/all`,
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

export const getStockVariantSummary = async (id:UUID,stockId:UUID) : Promise<stockVariantSummary>=> {
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const data: stockVariantSummary = await apiClient.get<stockVariantSummary>(
            `/api/stock-variants/${stockId}/summary/${id}`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}