'use server'
import { ActiveSubscription, Subscription } from "@/types/subscription/type";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";
import { RenewSubscriptionSchema } from "@/types/renew-subscription/schema";
import { z } from "zod";
import { RenewSubscription } from "@/types/renew-subscription/type";
import { FormResponse } from "@/types/types";
import { getCurrentLocation } from "./business/get-current-business";
import { getAuthenticatedUser } from "../auth-utils";

interface User {
    id: string;
  }
export const fetchSubscriptions = async (): Promise<Subscription[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get<Subscription[]>("/api/subscriptions/");
        const sortedSubscriptions  = response.sort((a, b) => a.amount - b.amount);
        console.log("The response from the API for subscriptions is:", response);
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
        // console.log("The response from the API for subscriptions is:", response);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
}

export const paySubscription = async (subscription:z.infer<typeof RenewSubscriptionSchema>): Promise<RenewSubscription> => {
    let formResponse: FormResponse | null = null;

    const user = await  getAuthenticatedUser() as User | null;
    const validSubscription = RenewSubscriptionSchema.safeParse(subscription)
    const provider = process.env.PAYMENT_PROVIDER

    if (!validSubscription.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill all the required fields",
            error: new Error(validSubscription.error.message),
        };
        return parseStringify(formResponse);
    }

    const payload = {
        ...validSubscription.data,
        userId: user?.id,
        provider:provider,
    }

    // console.log("payload", payload);

    const location = await getCurrentLocation();

    try {

        const apiClient = new ApiClient();
        const response = await apiClient.post(`/api/subscription-payments/${location?.id}/subscribe`, payload);
        return parseStringify(response);

    } catch (error: any){
        console.log("The error is", error );
        formResponse = {
            responseType: "error",
            message: error.message ? error.message : "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
    if ( formResponse.responseType === "error" ) return parseStringify(formResponse)

        return parseStringify({
            responseType: "success",
            message: "Subscription payment successful",
        });
}