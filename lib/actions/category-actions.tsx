"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import {Category} from "@/types/category/type";
import {CategorySchema} from "@/types/category/schema";
import {getCurrentLocation} from "@/lib/actions/business/get-current-business";


export const fetchAllCategories = async (): Promise<Category[] | null> => {
    await getAuthenticatedUser();

    try {
        const location = await getCurrentLocation();

        const apiClient = new ApiClient();

        const categoriesData = await apiClient.get(
            `/api/categories/${location?.id}`,
        );

        return parseStringify(categoriesData);
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

export const createCategory = async (
    category: z.infer<typeof CategorySchema>,
    path: string
): Promise<FormResponse<Category>> => {
    const authenticatedUser = await getAuthenticatedUser();
    if ("responseType" in authenticatedUser) {
        return parseStringify(authenticatedUser);
    }

    const validatedData = CategorySchema.safeParse(category);
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
            `/api/categories/${location?.id}/create`,
            validatedData.data
        );

        // Handle revalidation
        revalidatePath(path);

        return parseStringify({
            responseType: "success",
            message: "Category created successfully",
            data: parseStringify(response)
        });

    } catch (error: any) {
        return parseStringify({
            responseType: "error",
            message: error.message ?? "Failed to create category. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
};

export const updateCategory = async (
    id: UUID,
    category: z.infer<typeof CategorySchema>,
    context: "product" | "category",
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

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
        const location = await getCurrentLocation();

        await apiClient.put(
            `/api/categories/${location?.id}/${id}`,
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

    if (context === "category") {
        revalidatePath("/categories");
        redirect("/categories");
    }

    return parseStringify({
        responseType: "success",
        message: "Category created successfully",
    });

};

export const getCategory = async (id: UUID): Promise<ApiResponse<Category>> => {
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
        `/api/categories/${location?.id}`,
        query,
    );

    console.log(data)
    return parseStringify(data);
};

export const deleteCategory = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Category ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const location = await getCurrentLocation();

        await apiClient.delete(`/api/categories/${location?.id}/${id}`);
        revalidatePath("/categories");
    } catch (error: any) {
        const formattedError = await error;
        console.error("Error deleting stock", formattedError );

        throw new Error(formattedError.message);
    }
};