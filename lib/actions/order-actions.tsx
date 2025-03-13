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
                    key:"dateCreated",
                    direction:"DESC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const location = await getCurrentLocation();
        
        const orderData = await apiClient.post(
            `/api/orders/${location?.id}?dashboard=true`,
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
    const order= await apiClient.post(
        `/api/orders/${location?.id}?dashboard=true`,
        query,
    );
    
    return parseStringify(order)
}

export const getOrderReceipt= async (id:UUID)=> {
    const apiClient = new ApiClient();
    
    try {
        const order= await apiClient.get(
            `/api/order-receipts/${id}`
        );
        
        return parseStringify(order)

    } catch (error) {
        throw error
    }
   
}

export const getOrderLogs = async (id:UUID)=>{
    await getAuthenticatedUser();
    try{
        const apiClient = new ApiClient();
        const query ={
            
            page: 0,
            size: 100,
        }
        const orderLogs = await apiClient.post(
            `/api/order-logs/${id}`,query
        );
        return parseStringify(orderLogs);
    }catch (error){
        throw error;
    }
}
