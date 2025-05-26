"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { OrderItemRefunds, RefundReport } from "@/types/refunds/type";

export const fetchRefunds = async () : Promise<OrderItemRefunds[]> => {
    await  getAuthenticatedUser();

    const location = await getCurrentLocation();

    try {
        const apiClient = new ApiClient();

        const refunds= await  apiClient.get(
           `/api/order-item-refunds/${location?.id}`,
        );
       
        return parseStringify(refunds);

    }
    catch (error){
        throw error;
    }
}
export const searchOrderItemRefunds = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<OrderItemRefunds>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"orderItem.name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"dateOfReturn",
                    direction:"DESC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        // console.log("The location passed is: ", location)
        const refunds = await  apiClient.post(
            `/api/order-item-refunds/${location?.id}`,
            query
        );
        // console.log("The list of refunds in this location: ", refunds)
        return parseStringify(refunds);
    }
    catch (error){
        throw error;
    }

}
export const getRefund= async (id:UUID) : Promise<ApiResponse<OrderItemRefunds>> => {
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
    const refund= await apiClient.post(
        `/api/order-item-refunds/${location?.id}`,
        query,
    );
    return parseStringify(refund)
}

export const GetRefundReport = async (
    startDate?: string,
    endDate?: string
): Promise<RefundReport> => {
    
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const queryParams = new URLSearchParams();
        
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const queryString = queryParams.toString();
        const url = `/api/reports/${location?.id}/refunds/refunded-items${queryString ? `?${queryString}` : ''}`;
        const report = await apiClient.get(url);
        console.log("The refund report data is:", report);
        return parseStringify(report);
    } catch (error) {
        throw error;
    }
}
