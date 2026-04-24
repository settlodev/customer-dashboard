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
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    SUBSCRIPTION_SUSPENDED: 'SUBSCRIPTION_SUSPENDED',
    ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

const UI_ERROR_MESSAGES: Record<string, string> = {
    INVALID_PHONE_NUMBER: "The phone number you entered is not valid. Please check the format and try again.",
    INVALID_EMAIL: "The email address you entered is not valid. Please check and try again.",
    INVALID_PASSWORD: "Your password does not meet the requirements. It must be at least 8 characters.",
    INVALID_REQUEST: "The information you provided is not valid. Please check and try again.",
    SERVICE_CLIENT_ERROR: "Something went wrong while processing your request. Please try again.",
    DUPLICATE_ENTITY: "This record already exists. Please check for duplicates.",
    RESOURCE_NOT_FOUND: "The requested item could not be found.",
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
    SUBSCRIPTION_EXPIRED: "Your subscription has expired. Please renew to continue making changes.",
    SUBSCRIPTION_SUSPENDED: "Your subscription has been suspended. Please contact billing support.",
    ACCOUNT_SUSPENDED: "Your account has been suspended. Please contact billing support to reactivate.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    VALIDATION_ERROR: "Please check your input and try again.",
    CONFLICT: "This request is already being processed. Please wait a moment and try again.",
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
 * Attempts to extract a nested error code and message from a server message
 * that contains embedded JSON (e.g., "Auth Service request failed: {\"code\":\"INVALID_PHONE_NUMBER\",...}").
 */
function unwrapNestedError(message: string): { code?: string; message?: string } | null {
    const jsonMatch = message.match(/\{[^{}]*"code"\s*:\s*"[^"]+"/);
    if (!jsonMatch) return null;

    // Find the full JSON object starting from the match position
    const startIdx = message.indexOf("{", message.indexOf(jsonMatch[0]) > -1 ? message.indexOf(jsonMatch[0]) : 0);
    if (startIdx === -1) return null;

    // Extract from first { to the matching }
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < message.length; i++) {
        if (message[i] === "{") depth++;
        if (message[i] === "}") depth--;
        if (depth === 0) { endIdx = i; break; }
    }

    try {
        const nested = JSON.parse(message.substring(startIdx, endIdx + 1));
        return { code: nested.code, message: nested.message };
    } catch {
        return null;
    }
}

/**
 * Converts an API error code to a user-friendly message.
 * Handles nested error messages from service-to-service calls.
 * Falls back to the server-provided message, then a generic default.
 */
export function getUIErrorMessage(
    code?: string | null,
    serverMessage?: string | null,
    fallback: string = "An unexpected error occurred. Please try again.",
): string {
    // Direct match on the error code
    if (code && UI_ERROR_MESSAGES[code]) {
        // If the code is a wrapper (SERVICE_CLIENT_ERROR), try to unwrap first
        if (code === "SERVICE_CLIENT_ERROR" && serverMessage) {
            const nested = unwrapNestedError(serverMessage);
            if (nested?.code && UI_ERROR_MESSAGES[nested.code]) {
                return UI_ERROR_MESSAGES[nested.code];
            }
            if (nested?.message) {
                return nested.message;
            }
        }
        return UI_ERROR_MESSAGES[code];
    }

    // Try to unwrap nested JSON from the message itself
    if (serverMessage) {
        const nested = unwrapNestedError(serverMessage);
        if (nested?.code && UI_ERROR_MESSAGES[nested.code]) {
            return UI_ERROR_MESSAGES[nested.code];
        }
        if (nested?.message) {
            return nested.message;
        }
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
        let code = data.code || data.error;
        let message = data.message;

        // Unwrap nested service-to-service errors (e.g., "Auth Service request failed: {...}")
        if (message) {
            const nested = unwrapNestedError(message);
            if (nested?.code) code = nested.code;
            if (nested?.message) message = nested.message;
        }

        return {
            code,
            message,
            errors: data.errors,
            metadata: data.metadata,
            timestamp: data.timestamp,
        };
    } catch {
        return { message: response.statusText };
    }
}

export const handleSettloApiError = async (error: unknown): Promise<ErrorResponseType> => {
    // Pass through already-structured errors (e.g., SESSION_EXPIRED from the interceptor)
    if (error && typeof error === "object" && "code" in error && "status" in error && "timestamp" in error) {
        return error as ErrorResponseType;
    }

    const getErrorDetails = (axiosError: AxiosError): unknown => {
        const responseData = axiosError.response?.data as Record<string, unknown>;
        return responseData?.details || responseData?.error || responseData?.errors || responseData;
    };

    const getErrorMetadata = (axiosError: AxiosError): Record<string, unknown> | undefined => {
        const responseData = axiosError.response?.data as Record<string, unknown> | undefined;
        const metadata = responseData?.metadata;
        return metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : undefined;
    };

    const createErrorResponse = (
        status: number,
        code: string,
        message: string,
        details?: unknown,
        serverError?: ErrorResponseType['serverError'],
        metadata?: Record<string, unknown>,
    ): ErrorResponseType => {
        const baseResponse: ErrorResponseType = {
            status,
            code,
            message,
            details,
            metadata,
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
        const errorMetadata = getErrorMetadata(error);

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
            let serverMessage = (error.response.data as { message?: string })?.message;
            // Inventory Service returns `errorCode`; Accounts/Auth return `code`.
            // Accept both so UI branches on service-specific codes work uniformly.
            let serverCode = (error.response.data as { code?: string; errorCode?: string })?.code
                ?? (error.response.data as { errorCode?: string })?.errorCode;

            // Unwrap nested service-to-service error messages
            if (serverMessage) {
                const nested = unwrapNestedError(serverMessage);
                if (nested?.code) serverCode = nested.code;
                if (nested?.message) serverMessage = nested.message;
            }

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
                        serverCode || ErrorCodes.CONFLICT,
                        serverMessage || 'Resource conflict occurred.',
                        errorDetails,
                        undefined,
                        errorMetadata,
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
