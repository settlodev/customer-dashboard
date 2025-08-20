'use server'
import { ActiveSubscription, SubscriptionAddons, Subscriptions, ValidDiscountCode } from "@/types/subscription/type";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import { z } from "zod";
// import { RenewSubscription } from "@/types/renew-subscription/type";
import { ApiResponse, FormResponse } from "@/types/types";
import { getCurrentLocation } from "./business/get-current-business";
import { getAuthenticatedUser } from "../auth-utils";

export interface User {
    id: string;
    email: string;
    phoneNumber: string;
}

interface SubscriptionResponse {
    status: string;
    message: string;
    errorDescription?: string;
}
export const fetchSubscriptions = async (): Promise<Subscriptions[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get<Subscriptions[]>("/api/subscriptions/");
        const sortedSubscriptions = response.sort((a, b) => a.amount - b.amount);
        return parseStringify(sortedSubscriptions);
    } catch (error) {
        throw error;
    }
}



export const getSubscriptionAddons = async (
    q:string,
    page:number,
    pageLimit:number
): Promise<ApiResponse<SubscriptionAddons>> =>{
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();
        const query ={
            filters: [
                {
                    key:"name",
                    operator:"LIKE",
                    field_type:"STRING",
                    value:q,
                    isArchived:false
                },
            ],
            sorts:[
                {
                    key:"dateCreated",
                    direction:"ASC"
                }
            ],
            page:page ? page - 1:0,
            size:pageLimit ? pageLimit : 10
        }
        const data = await  apiClient.post(
            `/api/subscription-addons`,
            query
        );

        return parseStringify(data);
    }
    catch (error){
        throw error;
    }

}

export const getAllSubscriptions = async (): Promise<Subscriptions[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get("/api/subscriptions/");
        
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
};


export const getActiveSubscription = async (locationId?: string | null): Promise<ActiveSubscription> => {
    let location;
    
    if (locationId) {
        location = { id: locationId };
    } else {
        location = await getCurrentLocation();
    }
    
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/location-subscriptions/${location?.id}/active`);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}

export const validateDiscountCode = async (discountCode: string,locationId?:string): Promise<ValidDiscountCode> => {

    
    // let formResponse: FormResponse | null = null;
    const location = await getCurrentLocation() || { id: locationId };
    const payload = {
        discountCode: discountCode,
        locationId:location?.id
    }
    
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.post(`/api/subscription-discounts/validate-discount-code`,  payload );
        return parseStringify(response);
    } catch (error: any) {
    
        throw error;
    }
}


export const paySubscription = async (subscription: z.infer<typeof RenewSubscriptionSchema>) => {
    let formResponse: FormResponse | null = null;
    const user = await getAuthenticatedUser() as User | null;
    // console.log("The user is", user);
    const validSubscription = RenewSubscriptionSchema.safeParse(subscription);
    const provider = 'selcom';



    if (!validSubscription.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validSubscription.error.message),
        };
        return parseStringify(formResponse);
    }
    const location = await getCurrentLocation() || { id: validSubscription.data.locationId };
    

    const payload = {
        ...validSubscription.data,
        userId: user?.id,
        provider: provider,
        locationId: location?.id
    };


    console.log("Payload:", payload );

    try {
        const apiClient = new ApiClient();
        const response: SubscriptionResponse = await apiClient.post(`/api/subscription-payments/${location?.id}/subscribe`, payload);
        if (response && response.status === "FAILED") {

            formResponse = {
                responseType: "error",
                message: response.message,
                error: new Error(response.errorDescription || response.message),
            };
            return parseStringify(formResponse);
        }

        console.log("Payment successful:", response);

        return parseStringify(response);

    } catch (error: any) {
        console.error("Payment error:", error);

        if (error.response?.data) {
            
            formResponse = {
                responseType: "error",
                message: "Payment failed",
                error: error instanceof Error ? error : new Error(String(error)),
            };
            return parseStringify(formResponse);

        }

        formResponse = {
            responseType: "error",
            message: "Payment failed",
            error: error instanceof Error ? error : new Error(String(error)),
        }
        return parseStringify(formResponse);
    }
};


export const verifyPayment = async (transactionId: string,invoice?:string) => {
  
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/invoice-payments/${invoice}/${transactionId}`);
        
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}