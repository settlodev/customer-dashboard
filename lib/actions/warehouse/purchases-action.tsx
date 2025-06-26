"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import * as z from "zod";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";
import { PurchaseSchema } from "@/types/warehouse/purchase/schema";
import { Purchase } from "@/types/warehouse/purchase/type";
export const fetchAllPurchases = async (): Promise<Purchase[] | null> => {
    await getAuthenticatedUser();

    try {
        const location = await getCurrentLocation();

        const apiClient = new ApiClient();

        const purchasesData = await apiClient.get(
            `/api/purchase/${location?.id}`,
        );

        return parseStringify(purchasesData);
    } catch (error) {
        throw error;
    }
};

export const searchPurchases = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Purchase>> => {
    await getAuthenticatedUser();

    try {
        const location = await getCurrentLocation();
        const apiClient = new ApiClient();

        const query = {
            filters: [
                {
                    key: "name",
                    operator: "LIKE",
                    field_type: "STRING",
                    value: q,
                },
            ],
            sorts: [
                {
                    key: "name",
                    direction: "ASC",
                },
            ],
            page: page ? page - 1 : 0,
            size: pageLimit ? pageLimit : 10,
        };


        const data = await apiClient.post(
            `/api/purchase/${location?.id}`,
            query,
        );

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const createPurchases = async (
    purchase: z.infer<typeof PurchaseSchema>,
): Promise<FormResponse<Purchase>> => {
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser) {
        return parseStringify(authenticatedUser);
    }

    const validatedData = PurchaseSchema.safeParse(purchase);
    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the required fields",
            error: new Error(validatedData.error.message),
        });
    }

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();

        const response = await apiClient.post(
            `/api/purchase/${location?.id}/create`,
            validatedData.data
        );

       

        return parseStringify({
            responseType: "success",
            message: "Purchase Order created successfully",
            data: parseStringify(response)
        });

    } catch (error: any) {
        return parseStringify({
            responseType: "error",
            message: error.message ?? "Failed to create Purchase order. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
};

export const updatePurchases = async (
    id: UUID,
    purchase: z.infer<typeof PurchaseSchema>,
    
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = PurchaseSchema.safeParse(purchase);

    if (!validatedData.success) {
        formResponse = {
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        };

        return parseStringify(formResponse);
    }

    try {
        const apiClient = new ApiClient();
        const location = await getCurrentLocation();

        await apiClient.put(
            `/api/purchase/${location?.id}/${id}`,
            validatedData.data,
        );
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

   

    return parseStringify({
        responseType: "success",
        message: "Category created successfully",
    });

};

export const getPurchase = async (id: UUID): Promise<ApiResponse<Purchase>> => {
    const apiClient = new ApiClient();

    const query = {
        filters: [
            {
                key: "id",
                operator: "EQUAL",
                field_type: "UUID_STRING",
                value: id,
            },
        ],
        sorts: [],
        page: 0,
        size: 1,
    };

    const location = await getCurrentLocation();

    const data = await apiClient.post(
        `/api/purchase/${location?.id}`,
        query,
    );

    return parseStringify(data);
};

export const deletePurchase = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Purchase ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        await apiClient.delete(`/api/purchase/${location?.id}/${id}`);

        revalidatePath("/purchases");

    } catch (error: any) {
        const formattedError = await error;
        console.error("Error deleting purchase", formattedError );

        throw new Error(formattedError.message);
    }
};
