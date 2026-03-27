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
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    STOCK_VARIANT: 'STOCK_VARIANT',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
    RATE_LIMITED: 'RATE_LIMITED',
    MFA_REQUIRED: 'MFA_REQUIRED',
    MFA_INVALID: 'MFA_INVALID',
    INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE',
    INVALID_VERIFICATION_TOKEN: 'INVALID_VERIFICATION_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID_SIGNATURE: 'TOKEN_INVALID_SIGNATURE',
    TOKEN_MALFORMED: 'TOKEN_MALFORMED',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
    TOKEN_VERSION_MISMATCH: 'TOKEN_VERSION_MISMATCH',
    REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
    REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    PHONE_ALREADY_EXISTS: 'PHONE_ALREADY_EXISTS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;

const UI_ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: "The email or password you entered is incorrect. Please try again.",
    ACCOUNT_LOCKED: "Your account has been locked due to too many failed login attempts. Please try again in 30 minutes.",
    ACCOUNT_DISABLED: "Your account has been disabled. Please contact support for assistance.",
    ACCOUNT_NOT_VERIFIED: "Your email address has not been verified. Please check your inbox for a verification code.",
    EMAIL_ALREADY_EXISTS: "An account with this email address already exists. Please log in or use a different email.",
    PHONE_ALREADY_EXISTS: "An account with this phone number already exists. Please use a different number.",
    USER_NOT_FOUND: "No account found with this email address.",
    MFA_REQUIRED: "Multi-factor authentication is required. Please enter your verification code.",
    MFA_INVALID: "The MFA code you entered is incorrect. Please try again.",
    RATE_LIMITED: "Too many attempts. Please wait a few minutes before trying again.",
    INVALID_VERIFICATION_CODE: "The verification code is invalid or has expired. Please request a new one.",
    INVALID_VERIFICATION_TOKEN: "The verification link is invalid or has expired. Please request a new one.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again.",
    TOKEN_INVALID_SIGNATURE: "Your session is invalid. Please log in again.",
    TOKEN_MALFORMED: "Your session is invalid. Please log in again.",
    TOKEN_REVOKED: "Your session has been revoked. Please log in again.",
    TOKEN_VERSION_MISMATCH: "Your credentials have changed. Please log in again.",
    REFRESH_TOKEN_INVALID: "Your session has expired. Please log in again.",
    REFRESH_TOKEN_EXPIRED: "Your session has expired. Please log in again.",
    VALIDATION_ERROR: "Please check your input and try again.",
    CONFLICT: "This resource already exists.",
    NOT_FOUND: "The requested resource was not found.",
    FORBIDDEN: "You do not have permission to perform this action.",
    UNAUTHORIZED: "Please log in to continue.",
    NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
    SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again in a few moments.",
    SERVER_ERROR: "Something went wrong on our end. Please try again later.",
    OAUTH_TOKEN_INVALID: "Social sign-in verification failed. Please try again.",
    OAUTH_PROVIDER_ERROR: "Could not connect to the sign-in provider. Please try again.",
};

/**
 * Converts an API error code to a user-friendly message.
 * Falls back to the server-provided message, then a generic default.
 */
export function getUIErrorMessage(
    code?: string | null,
    serverMessage?: string | null,
    fallback: string = "An unexpected error occurred. Please try again.",
): string {
    if (code && UI_ERROR_MESSAGES[code]) {
        return UI_ERROR_MESSAGES[code];
    }
    return serverMessage || fallback;
}

export interface ApiErrorBody {
    code?: string;
    message?: string;
    error?: string;
    errors?: Record<string, string>;
    metadata?: Record<string, unknown>;
    timestamp?: string;
}

/**
 * Parses an API error response from fetch() into a structured object.
 * Safe to call on any Response — returns null fields if parsing fails.
 */
export async function parseApiError(response: Response): Promise<ApiErrorBody> {
    try {
        const data = await response.json();
        return {
            code: data.code || data.error,
            message: data.message,
            errors: data.errors,
            metadata: data.metadata,
            timestamp: data.timestamp,
        };
    } catch {
        return { message: response.statusText };
    }
}

export const handleSettloApiError = async (error: unknown): Promise<ErrorResponseType> => {
    const getErrorDetails = (axiosError: AxiosError): unknown => {
        const responseData = axiosError.response?.data as Record<string, unknown>;
        return responseData?.details || responseData?.error || responseData?.errors || responseData;
    };

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
            const serverCode = (error.response.data as { code?: string })?.code;

            switch (status) {
                case 400:
                    return createErrorResponse(
                        status,
                        ErrorCodes.VALIDATION_ERROR,
                        serverMessage || 'Invalid request parameters.',
                        errorDetails
                    );

                case 401: {
                    if (serverCode === 'INVALID_CREDENTIALS') {
                        return createErrorResponse(
                            status,
                            ErrorCodes.INVALID_CREDENTIALS,
                            serverMessage || 'Email or password is incorrect.',
                            errorDetails
                        );
                    }
                    if (serverCode === 'REFRESH_TOKEN_INVALID' || serverCode === 'REFRESH_TOKEN_EXPIRED') {
                        return createErrorResponse(
                            status,
                            ErrorCodes.REFRESH_TOKEN_INVALID,
                            serverMessage || 'Session expired. Please log in again.',
                            errorDetails
                        );
                    }
                    return createErrorResponse(
                        status,
                        ErrorCodes.UNAUTHORIZED,
                        serverMessage || 'Please log in to continue.',
                        errorDetails
                    );
                }

                case 403: {
                    if (serverCode === 'ACCOUNT_LOCKED') {
                        return createErrorResponse(
                            status,
                            ErrorCodes.ACCOUNT_LOCKED,
                            serverMessage || 'Account is locked due to too many failed attempts.',
                            errorDetails
                        );
                    }
                    if (serverCode === 'ACCOUNT_DISABLED') {
                        return createErrorResponse(
                            status,
                            ErrorCodes.ACCOUNT_DISABLED,
                            serverMessage || 'Account is disabled.',
                            errorDetails
                        );
                    }
                    return createErrorResponse(
                        status,
                        ErrorCodes.FORBIDDEN,
                        serverMessage || 'You do not have sufficient permissions to access this resource.',
                        errorDetails
                    );
                }

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

                case 412:
                    return createErrorResponse(
                        status,
                        ErrorCodes.MFA_REQUIRED,
                        serverMessage || 'Multi-factor authentication required.',
                        errorDetails
                    );

                case 422:
                    return createErrorResponse(
                        status,
                        ErrorCodes.VALIDATION_ERROR,
                        serverMessage || 'Validation error occurred.',
                        errorDetails
                    );

                case 429:
                    return createErrorResponse(
                        status,
                        ErrorCodes.RATE_LIMITED,
                        serverMessage || 'Too many requests. Please try again later.',
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

                case 502:
                case 503:
                case 504:
                    return createErrorResponse(
                        status,
                        ErrorCodes.SERVICE_UNAVAILABLE,
                        serverMessage || 'Service is temporarily unavailable. Please try again later.',
                        errorDetails
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
