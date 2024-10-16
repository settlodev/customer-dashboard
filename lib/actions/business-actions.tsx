"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import {getAuthenticatedUser, getAuthToken} from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import {Category} from "@/types/category/type";
import {CategorySchema} from "@/types/category/schema";
import {getCurrentBusiness, getCurrentLocation} from "@/lib/actions/business/get-current-business";
import {Business} from "@/types/business/type";

export const fetchAllBusinesses = async (): Promise<Business[] | null> => {
    await getAuthenticatedUser();

    try {
        const location = await getCurrentLocation();

        const apiClient = new ApiClient();

        const data = await apiClient.get(
            `/api/businesses/${location?.id}`,
        );

        return parseStringify(data);
    } catch (error) {
        throw error;
    }
};

export const searchCategories = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Category>> => {
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
            `/api/categories/${location?.id}`,
            query,
        );

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const createBusiness = async (
    category: z.infer<typeof CategorySchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();
    const authToken = await getAuthToken();
    const userId = authToken?.id;

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = CategorySchema.safeParse(category);

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

        await apiClient.post(
            `/api/businesses/${userId}/create`,
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

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/categories");
    redirect("/categories");
};

export const updateBusiness = async (
    id: UUID,
    business: z.infer<typeof CategorySchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();
    const authToken = await getAuthToken();
    const userId = authToken?.id;

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = CategorySchema.safeParse(business);

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

        await apiClient.put(
            `/api/businesses/${userId}/${id}`,
            validatedData.data
        );
    } catch (error: unknown) {
        formResponse = {
            responseType: "error",
            message:
                "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }

    if (formResponse) {
        return parseStringify(formResponse);
    }

    revalidatePath("/categories");
    redirect("/categories");
};

export const getBusiness = async (id: UUID): Promise<ApiResponse<Business>> => {
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

    const data = await apiClient.post(
        `/api/businesses/${id}`,
        query,
    );

    console.log("My Business", data)
    return parseStringify(data);
};

export const deleteBusiness = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Category ID is required to perform this request");
    await getAuthenticatedUser();
    const authToken = await getAuthToken();
    const userId = authToken?.id;
    try {
        const apiClient = new ApiClient();

        await apiClient.delete(`/api/businesses/${userId}/${id}`);
        revalidatePath("/categories");
    } catch (error) {
        throw error;
    }
};
