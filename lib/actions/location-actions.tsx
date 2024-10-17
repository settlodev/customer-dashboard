"use server";

import { UUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { getAuthenticatedUser } from "@/lib/auth-utils";
import { parseStringify } from "@/lib/utils";
import ApiClient from "@/lib/settlo-api-client";
import {ApiResponse, FormResponse} from "@/types/types";
import {getCurrentBusiness} from "@/lib/actions/business/get-current-business";
import {Location} from "@/types/location/type";
import {LocationSchema} from "@/types/location/schema";

export const fetchAllLocations = async (): Promise<Location[] | null> => {
    await getAuthenticatedUser();

    try {
        const business = await getCurrentBusiness();

        const apiClient = new ApiClient();

        const locationsData = await apiClient.get(
            `/api/locations/${business?.id}`,
        );

        return parseStringify(locationsData);
    } catch (error) {
        throw error;
    }
};

export const searchLocations = async (
    q: string,
    page: number,
    pageLimit: number,
): Promise<ApiResponse<Location>> => {
    await getAuthenticatedUser();

    try {
        const business = await getCurrentBusiness();
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
            `/api/locations/${business?.id}`,
            query,
        );

        return parseStringify(data);

    } catch (error) {
        throw error;
    }
};

export const createLocation = async (
    location: z.infer<typeof LocationSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = LocationSchema.safeParse(location);

    console.log("Validation result:", validatedData);

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
        const business = await getCurrentBusiness();


        const payload = {
            ...validatedData.data,
            business: business?.id,
        };

        await apiClient.post(
            `/api/locations/${business?.id}/create`,
            payload,
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

    revalidatePath("/locations");
    redirect("/locations");
};

export const updateLocation = async (
    id: UUID,
    location: z.infer<typeof LocationSchema>,
): Promise<FormResponse | void> => {
    let formResponse: FormResponse | null = null;
    const authenticatedUser = await getAuthenticatedUser();

    if ("responseType" in authenticatedUser)
        return parseStringify(authenticatedUser);

    const validatedData = LocationSchema.safeParse(location);

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
        const business = await getCurrentBusiness();

        await apiClient.put(
            `/api/locations/${business?.id}/${id}`,
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

    revalidatePath("/locations");
    redirect("/locations");
};

export const getLocation = async (id: UUID): Promise<ApiResponse<Location>> => {
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

    const business = await getCurrentBusiness();

    const data = await apiClient.post(
        `/api/locations/${business?.id}`,
        query,
    );

    console.log(data)
    return parseStringify(data);
};

export const deleteLocation = async (id: UUID): Promise<void> => {
    if (!id) throw new Error("Location ID is required to perform this request");
    await getAuthenticatedUser();

    try {
        const apiClient = new ApiClient();

        const business = await getCurrentBusiness();

        await apiClient.delete(`/api/locations/${business?.id}/${id}`);
        revalidatePath("/locations");
    } catch (error) {
        throw error;
    }
};
