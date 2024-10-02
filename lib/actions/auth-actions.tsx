"use server";

import * as z from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";
import { AuthError } from "next-auth";

import {
    LoginSchema,
    RegisterSchema
} from "@/types/data-schemas";
import { signIn, signOut } from "@/auth";
import { ExtendedUser, FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";
import { deleteAuthToken } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";

export async function logout() {
    try {
        //await deleteAuthToken();
        await signOut();
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }
        // Handle or log other types of errors
        console.error("Logout error:", error);
    }
}

export const login = async (
    credentials: z.infer<typeof LoginSchema>,
): Promise<FormResponse> => {
    const validatedData = LoginSchema.safeParse(credentials);
    console.log("credentials are:", credentials);
    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        });
    }

    //Make sure token does not exist
    await deleteAuthToken();

    try {
        const result = await signIn("credentials", {
            email: validatedData.data.email,
            password: validatedData.data.password,
            redirect: false,
        });

        if (result?.error) {
            return parseStringify({
                responseType: "error",
                message: "Wrong credentials! Invalid email address and/or password",
            });
        }

        // If login is successful, return a success message
        return parseStringify({
            responseType: "success",
            message: "Login successful, redirecting...",
        });
    } catch (error) {
        console.error(error);
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return parseStringify({
                        responseType: "error",
                        message: "Wrong credentials! Invalid email address and/or password",
                    });
                default:
                    return parseStringify({
                        responseType: "error",
                        message:
                            "Something about your credentials is not right, please try again.",
                        error: error,
                    });
            }
        }

        return parseStringify({
            responseType: "error",
            message: "An unexpected error occurred. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
};

export const getUserById = async (userId: string): Promise<ExtendedUser> => {
    if (!userId) throw new Error("User data is required");

    const apiClient = new ApiClient();

    try {
        const userDetails = await apiClient.get<{ emailVerified: boolean }>(
            `/api/users/${userId}`,
        );

        return parseStringify(userDetails);
    } catch (error) {
        // Ignore redirect error
        if (isRedirectError(error)) throw error;
        throw error;
    }
};

export const verifyToken = async (token: string): Promise<FormResponse> => {
    if (!token) throw new Error("Authentication token is required");

    const apiClient = new ApiClient();

    try {
        const tokenResponse = await apiClient.get(
            `/api/auth/verify-token/${token}`,
        );

        if (tokenResponse == token) {
            return parseStringify({
                responseType: "success",
                message: "Token verified successfully. Please login to your account.",
            });
        } else {
            return parseStringify({
                responseType: "error",
                message: "Token verification failed.",
                error: new Error(String("Token verification failed.")),
            });
        }
    } catch (error) {
        return parseStringify({
            responseType: "error",
            message: "Token verification failed.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
};

export const validateEmail = async (userId: string): Promise<FormResponse> => {
    if (!userId) throw new Error("User is required");

    const apiClient = new ApiClient();

    try {
        const emailVerificationResponse = await apiClient.put(
            `/api/users/verify-email/${userId}`,
            {},
        );

        return parseStringify({ emailVerificationResponse });
    } catch (error) {
        throw error;
    }
};

export const generateVerificationToken = async (
    email: string,
): Promise<any> => {
    if (!email) throw new Error("Email address is required");

    const apiClient = new ApiClient();

    try {
        const tokenResponse = await apiClient.put(
            `/api/auth/generate-verification-token/${email}`,
            {},
        );

        //send verification email with token
    } catch (error) {
        throw error;
    }
};

export const register = async (
    credentials: z.infer<typeof RegisterSchema>,
): Promise<FormResponse> => {
    const validatedData = RegisterSchema.safeParse(credentials);
    console.log("credentials are:", credentials);
    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        });
    }

    try {    
        const apiClient = new ApiClient();
        const result = await apiClient.post("/api/auth/register", validatedData.data);
        return parseStringify(result);  
    } catch (error) {
        throw error;
    }
}

export const resetPassword = async (
    email: string,
): Promise<FormResponse> => {
    if (!email) throw new Error("Email address is required");   
    const apiClient = new ApiClient();
    try {
        const result = await apiClient.put(`/api/auth/reset-password/${email}`, {});
        console.log("Response from API after reset ",result)
        return parseStringify(result);
    } catch (error) {
        throw error;
    }
}
