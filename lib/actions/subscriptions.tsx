'use server'
import { ActiveSubscription, Subscriptions } from "@/types/subscription/type";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import { z } from "zod";
// import { RenewSubscription } from "@/types/renew-subscription/type";
import { FormResponse } from "@/types/types";
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

export const getActiveSubscription = async (): Promise<ActiveSubscription> => {
    const location = await getCurrentLocation();
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/location-subscriptions/${location?.id}/active`);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}

export const validateDiscountCode = async (discountCode: string): Promise<any> => {
    // let formResponse: FormResponse | null = null;
    const location = await getCurrentLocation();
    const payload = {
        discountCode: discountCode
    }
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.post(`/api/subscription-payments/${location?.id}/validate-discount-code`, { data: payload });
        console.log("response", response);
        return parseStringify(response);
    } catch (error) {
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


export const verifyPayment = async (transactionId: string,locationId?:string) => {
    const location = await getCurrentLocation() || {id:locationId};
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get(`/api/subscription-payments/${location?.id}/verify/${transactionId}`);
        console.log("Payment verification response:", response);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}