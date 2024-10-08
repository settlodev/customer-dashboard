"use server"

import ApiClient from "../settlo-api-client";
import { parseStringify } from "../utils";

export const fetchExpenseCategories = async () => {
    try {
        const apiClient = new ApiClient();
        const response = await apiClient.get("/api/expense-categories");
        return parseStringify(response);
    } catch (error) {
        throw error;
    }   
}