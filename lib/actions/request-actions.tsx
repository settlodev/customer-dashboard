"use server";

import { UUID } from "node:crypto";
import { ApiResponse, FormResponse} from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { StockRequests } from "@/types/warehouse/purchase/request/type";
import { getCurrentLocation } from "./business/get-current-business";
import { StockRequestSchema } from "@/types/stock-request/schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";


export const searchStockRequests = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<StockRequests>> => {
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "stockVariant.name",
                    operator: "LIKE",
                    field_type: "STRING",
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
                    key: "dateCreated",
                    direction: "DESC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };

        const location = await getCurrentLocation();

        const requests= await apiClient.post(
            `/api/location/${location?.id}/warehouse-stock-requests`,
            query,
        );

        return parseStringify(requests);
    } catch (error) {
        throw error;
    }
};

export const getStockRequest = async (id: UUID) => {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();

    const stockRequest = await apiClient.get(
        `/api/location/${location?.id}/warehouse-stock-requests/${id}`,
    );
    
    return parseStringify(stockRequest);
};

export const createStockRequest = async (
    request: z.infer<typeof StockRequestSchema>
): Promise<FormResponse | void> => {

    let formResponse: FormResponse | null = null;

    const validData = StockRequestSchema.safeParse(request);

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
        comment: validData.data.comment,
        fromLocation: validData.data.fromLocation,
        toWarehouse: validData.data.toWarehouse,
        locationStaffRequested: validData.data.locationStaffRequested,
        stockRequested: validData.data.stockRequested.map(item => ({
            warehouseStockVariant: item.warehouseStockVariant,
            quantity: item.quantity
        }))
    };
    
    try {
        const apiClient = new ApiClient();
       await apiClient.post(
            `/api/location/${location?.id}/warehouse-stock-requests/create`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock request created successfully",
        };
    } catch (error: any) {
        const formattedError = await error
        console.error("Error creating stock request", formattedError);
        formResponse = {
            responseType: "error",
            message: formattedError.message,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/stock-requests");
   return parseStringify(formResponse);
};

export const updateStockRequest = async (
    id: UUID,
    request: z.infer<typeof StockRequestSchema>
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;

    const validData = StockRequestSchema.safeParse(request);

    if (!validData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validData.error.message)
        };
        return parseStringify(formResponse);
    }

    const payload = {
        comment: validData.data.comment,
        fromLocation: validData.data.fromLocation,
        toWarehouse: validData.data.toWarehouse,
        locationStaffRequested: validData.data.locationStaffRequested,
        stockRequested: validData.data.stockRequested.map(item => ({
            warehouseStockVariant: item.warehouseStockVariant,
            quantity: item.quantity
        }))
    };
    console.log("The payload to update stock request:", payload);

    const location= await getCurrentLocation();

    try {
        const apiClient = new ApiClient();
       await apiClient.put(
            `/api/location/${location?.id}/warehouse-stock-requests/${id}`,
            payload
        );
        formResponse = {
            responseType: "success",
            message: "Stock request updated successfully",
        };
    } catch (error: any) {
        const formattedError = await error
        console.error("Error updating stock request", formattedError);
        formResponse = {
            responseType: "error",
            message: formattedError.message,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    revalidatePath("/stock-requests");
   return parseStringify(formResponse);
};