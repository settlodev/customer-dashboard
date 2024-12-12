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
    try {
        console.log('👤 Getting authenticated user...');
        const user = await getAuthenticatedUser();
        console.log('✅ Authenticated user:', user);

        console.log('🏢 Fetching current business...');
        const business = await getCurrentBusiness();
        console.log('📦 Current business:', business);

        if (!business) {
            console.warn('⚠️ No business found, returning null');
            return null;
        }

        console.log(`🔄 Creating API client and fetching locations for business ID: ${business.id}`);
        const apiClient = new ApiClient();

        const locationsData = await apiClient.get(
            `/api/locations/${business.id}`,
        );
        console.log('📍 Raw locations data:', locationsData);

        const parsedLocations = parseStringify(locationsData);
        console.log('✨ Parsed locations:', parsedLocations);

        return parsedLocations;
    } catch (error) {
        console.error('❌ Error in fetchAllLocations:', error);
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
                    field_type: "UUID_STRING",
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

        console.log(data)
        return parseStringify(data);

    } catch (error) {

        console.log(error)
        throw error;
    }
};

export const createLocation = async (
    location: z.infer<typeof LocationSchema>,
): Promise<FormResponse> => {
    let formResponse: FormResponse | null = null;

    try {
        // Authentication check
        const authenticatedUser = await getAuthenticatedUser();
        if ("responseType" in authenticatedUser) {
            return parseStringify({
                responseType: "error",
                message: "Authentication failed",
                error: new Error("User not authenticated")
            });
        }

        // Validate input data
        const validatedData = LocationSchema.safeParse(location);
        if (!validatedData.success) {
            return parseStringify({
                responseType: "error",
                message: "Please fill in all the fields marked with * before proceeding",
                error: new Error(validatedData.error.message),
            });
        }

        // Get current business
        const business = await getCurrentBusiness();
        if (!business?.id) {
            console.error('Business ID not found', {
                authenticatedUser,
                location
            });
            return parseStringify({
                responseType: "error",
                message: "Business information not found",
                error: new Error("Business ID is required")
            });
        }

        // Prepare payload
        const payload = {
            ...validatedData.data,
            business: business.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const apiClient = new ApiClient();
        const response = await apiClient.post(
            `/api/locations/${business.id}/create`,
            payload,
        );

        formResponse = parseStringify({
            responseType: "success",
            message: "Location created successfully",
            data: response
        });

    } catch (error: unknown) {
        console.error('Error creating location', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            location
        });

        return parseStringify({
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }

    if (formResponse) {
        if (formResponse.responseType === "success") {
            revalidatePath("/locations");
            redirect("/locations");
        }
        return formResponse;
    }

    // Fallback
    return parseStringify({
        responseType: "error",
        message: "An unexpected error occurred",
        error: new Error("No response was generated")
    });
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

        const payload = {
            ...validatedData.data,
            business: business?.id,
        };

        await apiClient.put(
            `/api/locations/${business?.id}/${id}`,
            payload
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
