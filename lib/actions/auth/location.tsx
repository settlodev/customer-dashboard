"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationSchema } from "@/types/location/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { cookies } from "next/headers";
import { z } from "zod";
import { Location } from "@/types/location/type";
import { refreshLocation } from "../business/refresh";
import {signOut} from "@/auth";
import {isRedirectError} from "next/dist/client/components/redirect";
import { console } from "inspector";

export const createBusinessLocation = async (
    businessLocation: z.infer<typeof LocationSchema>
): Promise<FormResponse> => {
    // Validate input data
    const validationResult = LocationSchema.safeParse(businessLocation);

    console.log('Validation result:', validationResult);

    if (!validationResult.success) {
        return parseStringify({
            responseType: 'error',
            message: 'Please fill all the required fields',
            error: new Error(validationResult.error.message)
        });
    }

    try {
        // Get business ID from cookies
        const activeBusiness = cookies().get('activeBusiness')?.value;
        if (!activeBusiness) {
            throw new Error('No active business found');
        }

        const business = JSON.parse(activeBusiness);
        const businessId = business.Business.id;

        // Prepare payload
        const payload = {
            ...validationResult.data,
            business: businessId,
        };


        // Make API request
        const apiClient = new ApiClient();
        const response = await apiClient.post(
            `/api/locations/${businessId}/create`,
            payload
        );

        if (!response) {
            throw new Error('No response received from server');
        }

        // Handle authentication
        const token = cookies().get('authToken')?.value;
        if (!token) {
            await signOut();
            throw new Error('Authentication token not found');
        }

        // Update auth token and refresh location
        const authToken = JSON.parse(token) as AuthToken;
        authToken.locationComplete = true;
        cookies().set('authToken', JSON.stringify(authToken), {
            path: '/',
            httpOnly: true
        });

        await refreshLocation(response as Location);

        return parseStringify({
            responseType: 'success',
            message: 'Location created successfully, redirecting to dashboard...'
        });

    } catch (error: any) {
        // Ignore redirect error
        if (isRedirectError(error)) throw error;

        console.error('Location creation error:', error);
        return parseStringify({
            responseType: 'error',
            message: error.message ?? 'Something went wrong while processing your request, please try again',
            error: error instanceof Error ? error : new Error(String(error.message ?? error))
        });
    }
};

export const getAllBusinessLocationsByBusinessID = async (
    businessId: string
): Promise<Location[]> => {
    const apiClient = new ApiClient();
    try {
        const response = await apiClient.get(
            `/api/locations/${businessId}`
        );
        console.log("The response from the API for locations is:", response);
        return parseStringify(response);

    } catch (error) {
        return parseStringify({
            responseType: "error",
            message: "Something went wrong while processing your request, please try again",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
}

