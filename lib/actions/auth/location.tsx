"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { LocationSchema } from "@/types/location/schema";
import { AuthToken, FormResponse } from "@/types/types";
import { cookies } from "next/headers";
import { z } from "zod";
import { Location } from "@/types/location/type";
import { switchLocation } from "../business/refresh";
import { signOut } from "@/auth";
import { getCurrentBusiness } from "@/lib/actions/business/get-current-business";


export const createBusinessLocation = async (
    businessLocation: z.infer<typeof LocationSchema>
): Promise<FormResponse> => {
    try {
        // Handle authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('authToken')?.value;
        if (!token) {
            await signOut();
            throw new Error('Authentication token not found');
        }

        // Validate input data
        const validationResult = LocationSchema.safeParse(businessLocation);

        if (!validationResult.success) {
            return parseStringify({
                responseType: 'error',
                message: 'Please fill all the required fields',
                error: new Error(validationResult.error.message)
            });
        }

        // Get business ID from cookies
        const currentBusiness = await getCurrentBusiness();
        if (!currentBusiness) {
            throw new Error('No active business found');
        }

        // Prepare payload
        const payload = {
            ...validationResult.data,
            business: currentBusiness.id,
        };

        // Make API request
        const apiClient = new ApiClient();
        const response = await apiClient.post(
            `/api/locations/${currentBusiness.id}/create`,
            payload
        );

        
        if (!response) {
            throw new Error('No response received from server');
        }

        // Update auth token and refresh location
        const authToken = JSON.parse(token) as AuthToken;
        authToken.locationComplete = true;
        
        cookieStore.set({
            name: 'authToken',
            value: JSON.stringify(authToken),
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        await switchLocation(response as Location);

       

    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error; 
        }
        
        return parseStringify({
            responseType: 'error',
            message: error.message ?? 'Something went wrong while processing your request, please try again',
            error: error instanceof Error ? error : new Error(String(error.message ?? error))
        });
    }
    return parseStringify({
        responseType: 'success',
        message: 'Location created successfully',
        
    });
};