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
                        error: "Unauthorized, you are not allowed to perform this action.",
                        message: "Unauthorized, you are not allowed to perform this action.",
                    };
                case 403:

                    return {
                        status: 403,
                        code : "FORBIDDEN",
                        error: "Error: You do not have sufficient permissions to perform this action.",
                        message: "You do not have sufficient permissions to perform this action.",
                    };
                case 404:
                    return {
                        status: 404,
                        code : "NOT_FOUND",
                        error: "Sorry, we could not find a valid resource with your request, please try again.",
                        message: "Sorry, we could not find a valid resource with your request, please try again.",
                    };
                case 409:
                    return {
                    status: 409,
                    code : "CONFLICT",
                    error:"Delete first the stock variant, then delete the stock",
                    message:"Delete first the stock variant, then delete the stock",
                }    
                case 601:
                    return {
                        status: 601,
                        code : "EMAIL EXIST",
                        error: "Email already registered",
                        message: "Email already registered",
                    };
                case 602:
                    return {
                        status: 602,
                        code : "PHONE EXIST",
                        error: "Phone number already registered",
                        message: "Phone number already registered",
                    };
                case 603:
                    return {
                        status: 603,
                        code : "WRONG CREDENTIALS",
                        error: "Login failed, wrong credentials",
                        message: "Login failed, wrong credentials",
                    };
                case 500:
                    return {
                        status: 500,
                        code : "SERVER_ERROR",
                        error: "There is error with the system, please try again later",
                        message: "There is error with the system, please try again later",
                    };
                default:
                    return {
                        status: 500,
                        code : "SERVER_ERROR",
                        error:
                            "Something went wrong while processing your request, please try again.",
                        message:
                            "Something went wrong while processing your request, please try again.",
                    };
            }
        } else {
            return {
                status: 500,
                code : "SERVER_ERROR",
                error: "Something went wrong while processing your request, please try again.",
                message: "Something went wrong while processing your request, please try again.",
            };
        }
    } else {
        return {
            status: 500,
            code : "SERVER_ERROR",
            error: "Something went wrong while processing your request, please try again.",
            message: "Something went wrong while processing your request, please try again.",
        };
    }
};




