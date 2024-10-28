import { AxiosError } from "axios";
import {ErrorMessageType} from "@/types/types";

export const handleSettloApiError = (axiosError: AxiosError) : ErrorMessageType => {
        if (axiosError.response) {
            switch (axiosError.response.status) {
                case 401:
                    return {
                        error: "Unauthorized, you are not allowed to perform this action.",
                        status: 401,
                        code: 'string',
                        message: "Unauthorized, you are not allowed to perform this action."
                    };
                case 403:
                    return {
                        error: "Error: You do not have sufficient permissions to perform this action.",
                        status: 403,
                        code: 'string',
                        message: "Error: You do not have sufficient permissions to perform this action."
                    };
                case 404:
                    return {
                        error: "Sorry, we could not find a valid resource with your request, please try again.",
                        status: 404,
                        code: 'string',
                        message: "Sorry, we could not find a valid resource with your request, please try again."
                    };
                case 409:
                    return {
                        error: "Something went wrong while processing your request, please try again.",
                        status: 409,
                        code: 'string',
                        message: "Phone number or email exists"
                    };
                default:
                    return {
                        error: "Something went wrong while processing your request, please try again.",
                        status: 1234,
                        code: 'string',
                        message: "Something went wrong while processing your request, please try again."
                    };
            }
        } else {
            return {
                error: "Something went wrong while processing your request, please try again.",
                status: 12345,
                code: 'string',
                message: "Something went wrong while processing your request, please try again."
            };
        }
    //     }
    // } else {
    //     return {
    //         error: "Something went wrong while processing your request, please try again.",
    //         status: 123456,
    //         code: 'string',
    //         message: "Something went wrong while processing your request, please try again."
    //     };
    // }
};
