import { ErrorMessageType } from "@/types/types";
import axios, { AxiosError } from "axios";

export const  handleSettloApiError =  async (error: unknown): Promise<ErrorMessageType> => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {

            switch (axiosError.response.status) {
                case 401:
                    return {
                        status: 401,
                        code : "UNAUTHORIZED",
                        error: error,
                        message: "Unauthorized, you are not allowed to perform this action.",
                    };
                case 403:

                    return {
                        status: 403,
                        code : "FORBIDDEN",
                        error: error,
                        message: "You do not have sufficient permissions to perform this action.",
                    };
                case 404:
                    return {
                        status: 404,
                        code : "NOT_FOUND",
                        error: error,
                        message: "Sorry, we could not find a valid resource with your request, please try again.",
                    };
                case 409:
                    return {
                    status: 409,
                    code : "CONFLICT",
                    error: error,
                    message:"Delete first the stock variant, then delete the stock",
                }
                case 601:
                    return {
                        status: 601,
                        code : "EMAIL EXIST",
                        error: error,
                        message: "Email already registered",
                    };
                case 602:
                    return {
                        status: 602,
                        code : "PHONE EXIST",
                        error: error,
                        message: "Phone number already registered",
                    };
                case 603:
                    return {
                        status: 603,
                        code : "WRONG CREDENTIALS",
                        error: error,
                        message: "Login failed, wrong credentials",
                    };
                case 604:
                    return {
                    status: 604,
                    code : "EMAIL VERIFIED",
                    error: error,
                    message:"Email already verified",
                }
                case 500:
                    return {
                        status: 500,
                        code : "SERVER_ERROR",
                        error: error,
                        message: "There is error with the system, please try again later",
                    };
                default:
                    return {
                        status: 500,
                        code : "SERVER_ERROR",
                        error: error,
                        message:
                            "Something went wrong while processing your request, please try again.",
                    };
            }
        } else {
            return {
                status: 500,
                code : "SERVER_ERROR",
                error: error,
                message: "Something went wrong while processing your request, please try again.",
            };
        }
    } else {
        return {
            status: 500,
            code : "SERVER_ERROR",
            error: new Error("Unhandled error."),
            message: "Something went wrong while processing your request, please try again.",
        };
    }
};




