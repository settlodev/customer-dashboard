"use server";

import * as z from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";
import { AuthError } from "next-auth";

import {
    LoginSchema,
    RegisterSchema,
    ResetPasswordSchema,
    UpdatePasswordSchema
} from "@/types/data-schemas";
import { signIn, signOut } from "@/auth";
import { ExtendedUser, FormResponse } from "@/types/types";
import { parseStringify } from "@/lib/utils";
import { deleteAuthToken } from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { sendPasswordResetEmail } from "./emails/send";

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

        console.log("tokenResponse from Peter", tokenResponse);

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
        return parseStringify({
            responseType: "success",
            message: "Registration successful, redirecting to login...",
        });  
    } catch (error) {
        console.error(error);
        return parseStringify({
            responseType: "error",
            message: "An unexpected error occurred. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
}

export const resetPassword = async (
    email: z.infer<typeof ResetPasswordSchema>,
): Promise<FormResponse> => {
    const validateEmail = ResetPasswordSchema.safeParse(email);

    console.log("validateEmail", validateEmail);

    if (!validateEmail.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validateEmail.error.message),
        });
    }
   
    try {
        const apiClient = new ApiClient();
        const result = await apiClient.post("/api/auth/reset-password", validateEmail.data);
        let token = result
        if(result) {
            await sendPasswordResetEmail(token);
        }
        return parseStringify({
            responseType: "success",
            message: "Password reset link sent to your email address",
            data: result
        });
    } catch (error) {
        throw error;
    }
}

export const updatePassword = async (
    passwordData: {password: string, token: string},
): Promise<FormResponse> => {
    const validatePassword = UpdatePasswordSchema.safeParse(passwordData);

    console.log("Password data being validated:", passwordData);
    console.log("Validation result:", validatePassword);

    if (!validatePassword.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatePassword.error.message),
        });
    }
    const payload={
        ...validatePassword.data,
        token: passwordData.token
    }
    console.log("The payload to update password", payload);
    const apiClient = new ApiClient();
    try {
       
        const response = await apiClient.post("/api/auth/update-password", payload);
        // console.log("Response from API after reset ", response);
        return parseStringify({
            responseType: "success",
            message: "Password updated successfully, redirecting to login...",
            data: response
        });
    } catch (error) {
        // throw error;
        console.log("Error from API after reset ", error);
        return parseStringify({
            responseType: "error",
            message: "Password reset failed.",
            error: error instanceof Error ? error : new Error(String(error)),
        })
    }
}
