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
import {signIn, signOut} from "@/auth";
import {ExtendedUser, FormResponse} from "@/types/types";
import { parseStringify } from "@/lib/utils";
import {deleteAuthCookie, getUser} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import {sendPasswordResetEmail, sendVerificationEmail} from "./emails/send";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {DEFAULT_LOGIN_REDIRECT_URL} from "@/routes";

export async function logout() {
    try {
        //Make sure token does not exist
        await deleteAuthCookie();

        await signOut();
    } catch (error) {
        if (error instanceof AuthError) {
            throw error;
        }
        // Handle or log other types of errors
        console.error("Logout error:", error);
    }
}

// export const login = async (
//     credentials: z.infer<typeof LoginSchema>,
// ): Promise<FormResponse> => {
//     const validatedData = LoginSchema.safeParse(credentials);
//     if (!validatedData.success) {
//         return parseStringify({
//             responseType: "error",
//             message: "Please fill in all the fields marked with * before proceeding",
//             error: new Error("Incomplete credentials"),
//         });
//     }

//     //Make sure token does not exist
//     await deleteAuthCookie();

//     try {
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         const result = await signIn("credentials", {
//             email: validatedData.data.email,
//             password: validatedData.data.password,
//             redirect: false,
//         });

//         if (result?.error) {
//             console.log("result.error: ", result.error);
//             return parseStringify({
//                 responseType: "error",
//                 message: "Wrong credentials! Invalid email address and/or password",
//                 error: new Error("Wrong credentials"),
//             });
//         }

//     } catch (error) {
//         if (error instanceof AuthError) {
//             console.log("error during login: ", error);
//             switch (error.name) {
//                 case "CredentialsSignin":
//                     return parseStringify({
//                         responseType: "error",
//                         message: "Wrong credentials! Invalid email address and/or password",
//                         error: new Error("Wrong credentials"),
//                     });
//                 default:
//                     return parseStringify({
//                         responseType: "error",
//                         message: error.message ?? "Something about your credentials is not right, please try again.",
//                         error: new Error("Unexpected"),
//                     });
//             }
//         }

//         return parseStringify({
//             responseType: "error",
//             message: "An unexpected error occurred. Please try again.",
//             error: new Error("Unexpected"),
//         });
//     }

//     revalidatePath(DEFAULT_LOGIN_REDIRECT_URL);
//     redirect(DEFAULT_LOGIN_REDIRECT_URL);
// };

export const login = async (
    credentials: z.infer<typeof LoginSchema>,
): Promise<FormResponse> => {
    const validatedData = LoginSchema.safeParse(credentials);
    if (!validatedData.success) {
        return parseStringify({
            responseType: "error",
            message: "Please fill in all the fields marked with * before proceeding",
            error: new Error("Incomplete credentials"),
        });
    }

    // Make sure token does not exist
    await deleteAuthCookie();

    try {
        const result = await signIn("credentials", {
            email: validatedData.data.email,
            password: validatedData.data.password,
            redirect: false,
        });

        console.log("result after login: ", result);

        // Check if there's an error in the result
        if (result?.error) {
            console.log("Authentication error:", result.error);
            return parseStringify({
                responseType: "error",
                message: "Wrong credentials! Invalid email address and/or password",
                error: new Error(result.error),
            });
        }

        // If we reach here, authentication was successful
        revalidatePath(DEFAULT_LOGIN_REDIRECT_URL);
        redirect(DEFAULT_LOGIN_REDIRECT_URL);
    } catch (error) {
        console.log("Error during login:", error);
        
        if (error instanceof AuthError) {
            switch (error.type) {  // Use error.type instead of error.name
                case "CredentialsSignin":
                    return parseStringify({
                        responseType: "error",
                        message: "Wrong credentials! Invalid email address and/or password",
                        error: new Error("Wrong credentials"),
                    });
                default:
                    return parseStringify({
                        responseType: "error",
                        message: error.message ?? "Something about your credentials is not right, please try again.",
                        error: new Error("Unexpected"),
                    });
            }
        }

        return parseStringify({
            responseType: "error",
            message: "An unexpected error occurred. Please try again.",
            error: new Error("Unexpected"),
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

    // first logout without redirecting
    await signOut({redirect: false});

    const apiClient = new ApiClient();

    try {
        const tokenResponse = await apiClient.get(
            `/api/auth/verify-token/${token}`,
        );

        // console.log("tokenResponse is: ", tokenResponse)

        if (tokenResponse == token) {
            revalidatePath("/user-verification");
            revalidatePath("/business-registration");
            revalidatePath("/login");

            return parseStringify({
                responseType: "success",
                message: "Your email address has been successfully verified. Redirecting to login page...",
            });


        } else {
            return parseStringify({
                responseType: "error",
                message: "The token provided is already used or expired, please try again.",
                error: new Error(String("The token provided is already used or expired, please try again.")),
            });
        }
    } catch (error: any) {

        if ( error.status === 604 ) {
            revalidatePath("/business-registration");
            revalidatePath("/user-verification");
            revalidatePath("/login");

            return parseStringify({
                responseType: "success",
                message: "Your email address has been successfully verified. Redirecting to login page...",
            });
        }

        return parseStringify({
            responseType: "error",
            message: error.message ?? "Something went wrong when verifying your token, please try again.",
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


    try {
        const apiClient = new ApiClient();

        //Make sure token does not exist
        await deleteAuthCookie();

        const regData: ExtendedUser = await apiClient.post("/api/auth/register", validatedData.data);
        // console.log("regData is: ", regData)
        if(regData){
            const response = await apiClient.put(`/api/auth/generate-verification-token/${regData.email}`, {});

            if(response) {
                await sendVerificationEmail(regData.name, response as string, regData.email);
            }

            //Disable login until email is verified
            // await signIn("credentials", {
            //     email: credentials.email,
            //     password: credentials.password,
            //     redirect: false,
            // });

            redirect("user-verification");
        }

        return parseStringify({
            responseType: "success",
            message: "Registration successful, redirecting to login...",
        });
    } catch (error : any) {

        // Ignore redirect error
        if (isRedirectError(error)) throw error;

        return parseStringify({
            responseType: "error",
            message: error.message ? error.message : "An unexpected error occurred. Please try again.",
            error: error instanceof Error ? error : new Error(String(error.message ? error.message : error)),
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
    } catch (error: any) {

        // Ignore redirect error
        if (isRedirectError(error)) throw error;

        return parseStringify({
            responseType: "error",
            message: error.message ? error.message : "An unexpected error occurred. Please try again.",
            error: error instanceof Error ? error : new Error(String(error.message ? error.message : error)),
        });
    }
}

export const updatePassword = async (
    passwordData: {password: string, token: string},
): Promise<FormResponse> => {
    const validatePassword = UpdatePasswordSchema.safeParse(passwordData);



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

    try {
        const response = await apiClient.put(`/api/auth/generate-verification-token/${email}`, {});
        if(response) {
            await sendVerificationEmail(name, response as string, email);
        }
        return parseStringify({
            responseType: "success",
            message: "Verification email sent successfully",
        });
    } catch (error: any) {
        return parseStringify({
            responseType: "error",
            message: error.message ?? "An unexpected error occurred. Please try again.",
            error: error instanceof Error ? error : new Error(String(error)),
        });
    }
}
