import { AxiosError } from "axios";
import {ErrorResponseType} from "@/types/types";

export const ErrorCodes = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    BUSINESS_ERROR: 'BUSINESS_ERROR',
    EMAIL_EXISTS: 'EMAIL_EXISTS',
    PHONE_EXISTS: 'PHONE_EXISTS',
    WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
} as const;

export const handleSettloApiError = async (error: unknown): Promise<ErrorResponseType> => {
    const getErrorDetails = (axiosError: AxiosError): unknown => {
        const responseData = axiosError.response?.data as Record<string, unknown>;
        return responseData?.details || responseData?.error || responseData;
    };

    // Helper function to create error response
    const createErrorResponse = (
        status: number,
        code: string,
        message: string,
        details?: unknown,
        serverError?: ErrorResponseType['serverError']
    ): ErrorResponseType => {
        const baseResponse: ErrorResponseType = {
            status,
            code,
            message,
            details,
            timestamp: new Date().toISOString(),
            path: (error as AxiosError)?.config?.url,
            correlationId: crypto.randomUUID(),
        };

        if (serverError) {
            baseResponse.serverError = serverError;
        }

        return baseResponse;
    };

    if (error instanceof AxiosError) {
        const errorDetails = getErrorDetails(error);

        if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
            return createErrorResponse(
                0,
                ErrorCodes.NETWORK_ERROR,
                'Network error occurred. Please check your connection.',
                { timeout: error.config?.timeout }
            );
        }

        if (error.response) {
            const { status } = error.response;
            const serverMessage = (error.response.data as { message?: string })?.message;

            switch (status) {
                case 400:
                    return createErrorResponse(
                        status,
                        ErrorCodes.VALIDATION_ERROR,
                        serverMessage || 'Invalid request parameters.',
                        errorDetails
                    );

                case 401:
                    return createErrorResponse(
                        status,
                        ErrorCodes.UNAUTHORIZED,
                        serverMessage || 'Unauthorized, please log in again.',
                        errorDetails
                    );

                case 403:
                    return createErrorResponse(
                        status,
                        ErrorCodes.FORBIDDEN,
                        serverMessage || 'You do not have sufficient permissions to access this resource.',
                        errorDetails
                    );

                case 404:
                    return createErrorResponse(
                        status,
                        ErrorCodes.NOT_FOUND,
                        serverMessage || 'Resource not found.',
                        errorDetails
                    );

                case 409:
                    return createErrorResponse(
                        status,
                        ErrorCodes.CONFLICT,
                        serverMessage || 'Resource conflict occurred.',
                        errorDetails
                    );

                case 422:
                    return createErrorResponse(
                        status,
                        ErrorCodes.VALIDATION_ERROR,
                        serverMessage || 'Validation error occurred.',
                        errorDetails
                    );

                case 601:
                    return createErrorResponse(
                        status,
                        ErrorCodes.EMAIL_EXISTS,
                        'Email already registered, please use a different email address.',
                        errorDetails
                    );

                case 602:
                    return createErrorResponse(
                        status,
                        ErrorCodes.PHONE_EXISTS,
                        'Phone number already registered, please use a different phone number.',
                        errorDetails
                    );

                case 603:
                    return createErrorResponse(
                        status,
                        ErrorCodes.WRONG_CREDENTIALS,
                        'Login failed, wrong credentials.',
                        errorDetails
                    );

                case 604:
                    return createErrorResponse(
                        status,
                        ErrorCodes.EMAIL_VERIFIED,
                        'Email already verified, please login to your account.',
                        errorDetails
                    );

                case 500:
                    return createErrorResponse(
                        status,
                        ErrorCodes.SERVER_ERROR,
                        serverMessage || 'Internal server error occurred.',
                        errorDetails,
                        {
                            name: error.name,
                            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                            details: error.response.data
                        }
                    );

                default:
                    return createErrorResponse(
                        status,
                        ErrorCodes.SERVER_ERROR,
                        serverMessage || 'An unexpected error occurred.',
                        errorDetails
                    );
            }
        }

        return createErrorResponse(
            500,
            ErrorCodes.NETWORK_ERROR,
            error.message || 'Failed to connect to the server.',
            { code: error.code, config: error.config }
        );
    }

    const unknownError = error as Error;
    return createErrorResponse(
        500,
        ErrorCodes.SERVER_ERROR,
        'An unexpected error occurred.',
        {
            name: unknownError.name,
            message: unknownError.message,
            stack: process.env.NODE_ENV === 'development' ? unknownError.stack : undefined
        }
    );
};
