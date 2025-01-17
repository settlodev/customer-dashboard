'use server'
import { Subscription } from "@/types/subscription/type";
import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";

export const fetchSubscriptions = async (): Promise<Subscription[]> => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get<Subscription[]>("/api/subscriptions/");
        const sortedSubscriptions  = response.sort((a, b) => a.amount - b.amount);
        return parseStringify(sortedSubscriptions);
    } catch (error) {
        throw error;
    }   
}