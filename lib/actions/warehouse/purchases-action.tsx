"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import { PurchaseSchema } from "@/types/warehouse/purchase/schema";
import { Purchase, StockIntakePurchasesReport } from "@/types/warehouse/purchase/type";
import { getCurrentWarehouse } from "./current-warehouse-action";

export const searchStockIntakePurchases = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Purchase>> => {
    await getAuthenticatedUser();

    try {
        const warehouse = await getCurrentWarehouse();
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "stockIntake.stockVariant.name",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
            ],
            // sorts: [
            //     {
            //         key: "name",
            //         direction: "ASC",
            //     },
            // ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };


        const data = await apiClient.post(
            `/api/stock-intake-purchases/${warehouse?.id}`,
            query,
        );

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const getStockIntakePurchase = async (id: UUID): Promise<ApiResponse<Purchase>> => {
    const apiClient = new ApiClient();

    const query = {
        filters: [
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            },
        ],
        sorts: [],
        page: 0,
        size: 1,
    };

    const warehouse = await getCurrentWarehouse();

    const data = await apiClient.post(
        `/api/stock-intake-purchases/${warehouse?.id}`,
        query,
    );

    return parseStringify(data);
};

export const payStockIntakePurchase = async (stockPurchaseId: UUID, amount: number): Promise<ApiResponse<Purchase>> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser) {
        return parseStringify(authenticatedUser);
    }

    // Validate the payment data using the schema
    const validatedData = PurchaseSchema.safeParse({ amount });

    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the required fields",
            error: new Error(validatedData.error.message),
        });
    }

    const apiClient = new ApiClient();
    
    try {
        await apiClient.post(
            `/api/stock-intake-purchase-payments/${stockPurchaseId}/create`,
            validatedData.data 
        );
        
        formResponse = {
            responseType: "success",
            message: "Payment made successfully",
        };
        
    } catch (error: any) {
        return parseStringify({
            responseType: "error",
            message: error.message ?? "Failed to create Purchase order. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }

    revalidatePath("/purchases");
    return parseStringify(formResponse);
}

export const stockIntakePurchaseReportForWarehouse = async (): Promise<StockIntakePurchasesReport | null> => {

    await getAuthenticatedUser();

    try {

        const apiClient = new ApiClient();
        const warehouse = await getCurrentWarehouse();
        
        const report=await apiClient.get(`/api/reports/${warehouse?.id}/stock-intake-purchases/summary`);


        return parseStringify(report);
        
    } catch (error) {
        console.error("Error fetching stock intake purchases report:", error);
        throw error;
    }
};