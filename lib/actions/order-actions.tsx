"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { Orders } from "@/types/orders/type";

export const fetchOrders = async () : Promise<Orders[]> => {
    await  getAuthenticatedUser();

    const location = await getCurrentLocation();

    try {
        const apiClient = new ApiClient();

        const ordersData= await  apiClient.get(
           `/api/orders/${location?.id}`,
        );
       
        return parseStringify(ordersData);

    }
    catch (error){
        throw error;
    }
}
export const searchOrder = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<Orders>> =>{
    await getAuthenticatedUser();


    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"orderNumber",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q
                }
            ],
            sorts:[
                {
                    key:"orderNumber",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        const orderData = await  apiClient.post(
            `/api/orders/${location?.id}`,
            query
        );
        return parseStringify(orderData);
    }
    catch (error){
        throw error;
    }

}
export const getOrder= async (id:UUID) : Promise<ApiResponse<Orders>> => {
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
    const unit= await apiClient.post(
        `/api/orders/${location?.id}`,
        query,
    );
    
    return parseStringify(unit)
}
