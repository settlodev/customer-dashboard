import axios, { AxiosError } from "axios";

export const handleSettloApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.log("axiosError.response:", axiosError.response?.data?.message)

        if (axiosError.response) {
            switch (axiosError.response.status) {
                case 401:
                    return {
                        error: "Unauthorized, you are not allowed to perform this action.",
                    };
                case 403:
                    return {
                        error:
                            "Error: You do not have sufficient permissions to perform this action.",
                    };
                case 404:
                    return {
                        error:
                            "Sorry, we could not find a valid resource with your request, please try again.",
                    };
                case 409:
                    return {
                        error: axiosError.response?.data?.message,
                    };
                default:
                    return {
                        error:
                            "Something went wrong while processing your request, please try again.",
                    };
            }
        } else {
            return {
                error:
                    "Something went wrong while processing your request, please try again.",
            };
        }
    } else {
        return {
            error:
                "Something went wrong while processing your request, please try again.",
        };
    }
};
