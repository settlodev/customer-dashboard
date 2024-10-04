"use server";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { Subscription } from "@/types/subscription/type";

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get("/api/subscriptions/");
        console.log("The response from the API for subscriptions is:", response);
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
};

 