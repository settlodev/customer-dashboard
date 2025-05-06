"use server";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { Subscriptions } from "@/types/subscription/type";

export const getAllSubscriptions = async (): Promise<Subscriptions[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get("/api/subscriptions/");
        
        return parseStringify(response);
    } catch (error) {
        throw error;
    }
};

 