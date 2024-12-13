"use server";

import {z} from "zod";
import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {revalidatePath} from "next/cache";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { console } from "node:inspector";
import { StockTransfer } from "@/types/stock-transfer/type";
import { StockTransferSchema } from "@/types/stock-transfer/schema";

export const fetchStockTransfers = async () : Promise<StockTransfer[]> => {
    await  getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        const data = await  apiClient.get(
            `/api/stock-transfers/${location?.id}/all`,
        );
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }
}
export const searchStockTransfers = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<StockTransfer>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"stockVariant.stock.name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            // sorts:[
            //     {
            //         key:"stockVariant.stock.name",
            //         direction:"ASC"
            //     }
            // ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const data = await  apiClient.post(
            `/api/stock-transfers/${location?.id}`,
            query
        );
        
        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}
export const createStockTransfer = async (
    transfer: z.infer<typeof StockTransferSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validData = StockTransferSchema.safeParse(transfer);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    const location= await getCurrentLocation();
    const payload = {
        ...validData.data,
    };
    console.log("The payload to create stock transfer:", payload);

    try {
        const apiClient = new ApiClient();
       await apiClient.post(
            `/api/stock-transfers/${location?.id}/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock transfer created successfully",
        };
    } catch (error: any) {
        const formattedError = await error
        console.error("Error creating stock transfer", formattedError);
        formResponse = {
            responseType: "error",
            message: formattedError.message,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/stock-transfers");
   return parseStringify(formResponse);
};


export const getStockTransferred= async (id:UUID, stockVariant:UUID) : Promise<ApiResponse<StockTransfer>> => {

    console.log("The id  & stockVariant to get stock intake: ", id , stockVariant)

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
        `/api/stock-transfers/${location?.id}/${id}`,
        query,
    );

    return parseStringify(response)
}


