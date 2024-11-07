"use server";

import * as z from "zod";
import { isRedirectError } from "next/dist/client/components/redirect";
import { AuthError } from "next-auth";

import {
    LoginSchema,
    RegisterSchema,
    ResetPasswordSchema,
    UpdatePasswordSchema,
    UpdateUserSchema
} from "@/types/data-schemas";
import {auth, signIn, signOut} from "@/auth";
import {ExtendedUser, FormResponse} from "@/types/types";
import { parseStringify } from "@/lib/utils";
import {createAuthToken, deleteAuthCookie, getUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import {sendPasswordResetEmail, sendVerificationEmail} from "./emails/send";
import {cookies} from "next/headers";

export async function logout() {
    try {
        await signOut();
        //await router.replace('/login');
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
    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        });
    }

    //Make sure token does not exist
    await deleteAuthCookie();

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const result = await signIn("credentials", {
            email: validatedData.data.email,
            password: validatedData.data.password,
            redirect: false,
        });

        console.log("result is now:", result)

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

export const getUserById = async (userId: string|undefined): Promise<ExtendedUser> => {
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                message: "Token user-verification failed.",
                error: new Error(String("Token user-verification failed.")),
            });
        }
    } catch (error) {
        return parseStringify({
            responseType: "error",
            message: "Token user-verification failed.",
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
): Promise<FormResponse> => {
    if (!email) throw new Error("Email address is required");

    const apiClient = new ApiClient();

    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const tokenResponse = await apiClient.put(
            `/api/auth/generate-verification-token/${email}`,
            {},
        );

        return parseStringify({ tokenResponse });

        //send user-verification email with token
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

    //Make sure token does not exist
    //await deleteAuthCookie();

    try {
        const apiClient = new ApiClient();

        const regData: ExtendedUser = await apiClient.post("/api/auth/register", validatedData.data);

        if(regData){
            const response = await apiClient.put(`/api/auth/generate-verification-token/${regData.email}`, {});
            console.log("my token response is:", response)
            if(response) {
                await sendVerificationEmail(regData.name, response as string, regData.email);
            }

            await signIn("credentials", {
                email: credentials.email,
                password: credentials.password,
                redirect: false,
            });
        }

        return parseStringify({
            responseType: "success",
            message: "Registration successful, redirecting to login...",
        });
    } catch (error) {
        console.log("Signup error:", error);
        const mError = JSON.stringify(error);
        const myNewError = JSON.parse(mError);
        return parseStringify({
            responseType: "error",
            message: myNewError.error,
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
}
export const updateUser = async (
    credentials: z.infer<typeof UpdateUserSchema>,
): Promise<FormResponse> => {
    const validatedData = UpdateUserSchema.safeParse(credentials);

    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error(validatedData.error.message),
        });
    }

    try {
        const user = await getUser();

        const apiClient = new ApiClient();
        await apiClient.put(`/api/users/${user?.id}`, validatedData.data);

        //await createAuthToken(user!);

        return parseStringify({
            responseType: "success",
            message: "Profile updated successful",
        });

    } catch (error) {
        console.error("Error is: ", error);
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
        if(result && typeof result === 'string') {
            await sendPasswordResetEmail(result, validateEmail.data.email);
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

export const resendVerificationEmail = async (name: any, email: any): Promise<FormResponse> => {
    const apiClient = new ApiClient();

    const response = await apiClient.put(`/api/auth/generate-verification-token/${email}`, {});
    console.log("my response is:", response)
    if(response) {
        await sendVerificationEmail(name, response as string, email);
        return parseStringify({
            responseType: "success",
            message: "Email sent",
            error: "",
        })
    }else{
        return parseStringify({
            responseType: "error",
            message: "Error sending email",
            error: "Error sending email",
        })
    }
}

export const verifyEmailToken = async (token: string) => {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    try {
        const response = await apiClient.get(`/api/auth/verify-token/${token}`);
        console.log("Verify response: ", response);
        const mySession = await auth();
        if(mySession?.user) {
            const cookie = cookies().get("authToken")?.value;
            const session = JSON.parse(cookie as string);
            const myUser = await getUserById(session.id);
            myUser.authToken = session.authToken as string;
            myUser.refreshToken = session.refreshToken as string;
            await createAuthToken(myUser);
            return "Successful activated token";
        }else{
            return "Continue to login";
        }
    }catch (error){
        console.log("My error", error);
        return "Error occurred during email verification";
    }
}
