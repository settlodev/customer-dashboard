import axios, { AxiosError } from "axios";

export const handleSettloApiError = async (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.log("axiosError.response:", axiosError.response)

        if (axiosError.response) {
            switch (axiosError.response.status) {
                case 401:
                    return {
                        error: "Unauthorized, you are not allowed to perform this action.",
                    };
                case 403:

                    return {
                        error: "Error: You do not have sufficient permissions to perform this action.",
                    };
                case 404:
                    return {
                        error: "Sorry, we could not find a valid resource with your request, please try again.",
                    };
                case 601:
                    return {
                        error: "Email already registered",
                    };
                case 602:
                    return {
                        error: "Phone number already registered",
                    };
                case 603:
                    return {
                        error: "Login failed, wrong credentials",
                    };
                case 500:
                    return {
                        error: "There is error with the system, please try again later",
                    };
                default:
                    return {
                        error:
                            "Something went wrong while processing your request, please try again.",
                    };
            }
        } else {
            return {
                error: "Something went wrong while processing your request, please try again.",
            };
        }
    } else {
        return {
            error: "Something went wrong while processing your request, please try again.",
        };
    }
};
