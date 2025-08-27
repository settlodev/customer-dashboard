"use server";

import ApiClient from "@/lib/settlo-api-client";
import {getAuthenticatedUser} from "@/lib/auth-utils";
import {parseStringify} from "@/lib/utils";
import {ApiResponse, FormResponse} from "@/types/types";
import {UUID} from "node:crypto";
import {getCurrentLocation } from "./business/get-current-business";
import { CashFlow, Credit, Orders } from "@/types/orders/type";
import { orderRequestSchema } from "@/types/orders/schema";
import { CartState } from "@/context/cartContext";


export const fetchOrders = async () : Promise<Orders[]> => {
    await  getAuthenticatedUser();

    const location = await getCurrentLocation();

    try {
        const apiClient = new ApiClient();

        const ordersData= await  apiClient.get(
           `/api/orders/${location?.id}?dashboard=true`,
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

export const getOrderReceipt = async (identifier: string | UUID) => {
    const apiClient = new ApiClient();
    
    try {
        const order = await apiClient.get(
            `/api/order-receipts/${identifier}`
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

export const cashFlowReport = async (startDate?: Date, endDate?: Date): Promise<CashFlow | null> => {

    await getAuthenticatedUser();
    try{
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const params = {
            startDate,
            endDate,
        }
        const report = await apiClient.get(`/api/reports/${location?.id}/cash-flow/summary`, {
            params
        });

        return parseStringify(report);
    }
    catch (error){
        console.error("Error fetching transactions report:", error);
        throw error
    }
}

export const creditReport = async (startDate?: Date, endDate?: Date): Promise<Credit | null> => {

    await getAuthenticatedUser();
    try{
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();
        const params = {
            startDate,
            endDate,
        }
        const report = await apiClient.get(`/api/reports/${location?.id}/credit/unpaid-orders`, {
            params
        });

        return parseStringify(report);
    }
    catch (error){
        console.error("Error fetching cashFlow report:", error);
        throw error
    }
}


export const submitOrderRequest = async (cartState: CartState) => {
    // console.log("The cart state is", cartState);

    let formResponse: FormResponse | null = null;


    if (!cartState.locationId) {
        formResponse = {
            responseType: "error",
            message: "Location information is missing. Please refresh and try again.",
            error: new Error("Missing locationId in cart state")
        };
        console.log("Missing locationId error:", formResponse);
        return parseStringify(formResponse);
    }

    // Transform cart state to API payload format
    const payload = {
        comment: cartState.globalComment || '',
        customerFirstName: cartState.customerDetails.firstName,
        customerLastName: cartState.customerDetails.lastName,
        customerPhoneNumber: cartState.customerDetails.phoneNumber,
        customerGender: cartState.customerDetails.gender,
        customerEmailAddress: cartState.customerDetails.emailAddress,
        
        orderRequestItems: cartState.orderRequestitems.map(item => {
            
            let variantId = item.variantId;
            
            if (!variantId && item.variants && item.variants.length > 0) {
                variantId = item.variants[0].id;
            }
            
            if (!variantId) {
                throw new Error(`Missing variant ID for product: ${item.name}`);
            }

            return {
                quantity: item.quantity,
                comment: item?.comment || '',
                variant: variantId, 
                discount: '', 
                modifiers: item?.modifiers || [],
                addons: item?.addons || [],
            };
        }),
    };

    // console.log("The payload is",payload)

    // Validate payload with Zod
    const validRequestData = orderRequestSchema.safeParse(payload);

    
    
    if (!validRequestData.success) {

        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validRequestData.error.message)
        }
        console.log("validation error",formResponse)
        return parseStringify(formResponse)

    }
    // const location = await getCurrentLocation();
    const location = cartState.locationId
    console.log("The location Id is",location)

    const finalPayload = {
        ...validRequestData.data,
        orderRequestServingType: "DINE_IN",
    }

    console.log("The final payload is",finalPayload);

    try {
    
    const apiClient = new ApiClient();

       const requestedOrder = await apiClient.post(
            `/api/order-request/${location}/create`,
           finalPayload,
            {
                headers: {
                    "Request-Origin": "ECOMMERCE"
                }
            }
        );
        // console.log("The requested order is",requestedOrder)
        formResponse = {
            responseType: "success",
            message: "Order has been requested successfully",
        };
    

  } catch (error:any) {
    console.error('Order submission error:', error.message);
    formResponse = {
        responseType: "error",
        message: error.message ?? "Something went wrong while processing your request, please try again",
        error: error instanceof Error ? error : new Error(String(error)),
    };
    
    return parseStringify(formResponse)
  }
}