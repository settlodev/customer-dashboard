"use server";

import { UUID } from "node:crypto";
import { ApiResponse} from "@/types/types";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentWarehouse } from "./current-warehouse-action";
import { StockRequestReport, StockRequests } from "@/types/warehouse/purchase/request/type";


export const searchWarehouseStockRequests = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<StockRequests>> => {
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();

        const query = {
            filters: [
                // {
                //     key: "",
                //     operator: "LIKE",
                //     field_type: "STRING",
                //     value: q,
                // },
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

        const warehouse = await getCurrentWarehouse();

        const requests= await apiClient.post(
            `/api/warehouse/${warehouse?.id}/warehouse-stock-requests`,
            query,
        );
        return parseStringify(requests);
    } catch (error) {
        throw error;
    }
};

export const getWarehouseStockRequest = async (id: UUID)=> {
    const apiClient = new ApiClient();
    
    const warehouse = await getCurrentWarehouse();

    const stockRequest = await apiClient.get(
        `/api/warehouse/${warehouse?.id}/warehouse-stock-requests/${id}`,
    );

    return parseStringify(stockRequest);
};

export const ApproveStockRequest = async (
    id: UUID,
    warehouseStaffApproved: UUID
): Promise<ApiResponse<StockRequests>> => {


    const apiClient = new ApiClient();

    const warehouse = await getCurrentWarehouse();

   const approvedRequest = await apiClient.put(
        `/api/warehouse/${warehouse?.id}/warehouse-stock-requests/approve/${id}`,
        {
            warehouseStaffApproved
        }
    );

    return parseStringify(approvedRequest);
};

export const CancelStockRequest = async (id: UUID,warehouseStaffApproved: UUID): Promise<ApiResponse<StockRequests>> => {

    console.log("The id is",id)
    console.log("The staff cancelled",warehouseStaffApproved)

    const apiClient = new ApiClient();

    const warehouse = await getCurrentWarehouse();

    const cancelledRequest = await apiClient.put(
        `/api/warehouse/${warehouse?.id}/warehouse-stock-requests/cancel/${id}`,{
            warehouseStaffApproved
        }
    );

    return parseStringify(cancelledRequest);
};

export const stockRequestReportForWarehouse = async (): Promise<StockRequestReport | null> => {

    await getAuthenticatedUser();

    try {

        const apiClient = new ApiClient();
        const warehouse = await getCurrentWarehouse();
        
        const report=await apiClient.get(`/api/reports/${warehouse?.id}/stock-requests/summary`);


        return parseStringify(report);
        
    } catch (error) {
        console.error("Error fetching stock request report:", error);
        throw error;
    }
};
