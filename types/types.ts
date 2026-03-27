import {UUID} from "node:crypto";
import {DefaultSession} from "next-auth";

export declare interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
    userId: string;
    accountId: string;
    email: string;
    emailVerified: boolean;
    verificationResendToken?: string;
    verificationResendTokenExpiresAt?: string;
    mfaRequired?: boolean;
    mfaToken?: string;
}

export type ApiResponse<T> = {
    warehouseStockRequestStatus: string;
    data: any;
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    size: number;
    content: T[];
    number: number;
    sort: ApiSortResponse;
    pageable: ApiResponsePage;
    numberOfElements: number;
    empty: boolean;
};

export type ApiResponsePage = {
    totalElements: number;
    pageNumber: number;
    pageSize: number;
    sort: ApiSortResponse;
    offset: number;
    paged: boolean;
    unpaged: boolean;
};

export type ApiSortResponse = {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
};

export interface FormResponse<T = unknown> {
    responseType: "success" | "error" | "needs_verification";
    message: string;
    error?: Error | null;
    data?: T;
}

export declare interface AuthToken {
    accessToken: string;
    refreshToken: string;
    userId: string;
    accountId: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    pictureUrl: string | null;
    emailVerified: boolean;
    isBusinessRegistrationComplete: boolean;
    isLocationRegistrationComplete: boolean;
    countryId: string;
    countryCode: string;
    theme: string | null;
    verificationResendToken?: string;
}

export declare interface activeBusiness {
    businessId: UUID | null;
}

export type ExtendedUser = DefaultSession["user"] & {
    id: string;
    name: string;
    email: string;
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string | null;
    country: UUID;
    role: UUID;
    phoneNumber: string;
    accessToken: string;
    refreshToken: string;
    emailVerified: Date | null;
    phoneNumberVerified: Date | null;
    consent: boolean | null;
    theme: string | null;
    isBusinessRegistrationComplete: boolean;
    isLocationRegistrationComplete: boolean;
    businessId: UUID | null;
    accountId: string;
    countryId: string;
    countryCode: string;
};

export declare interface RegisterResponse {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    pictureUrl: string | null;
    active: boolean;
    authId: string;
    accountNumber: string;
    isBusinessRegistrationComplete: boolean;
    isLocationRegistrationComplete: boolean;
    countryId: string;
    countryCode: string;
    emailVerificationRequired: boolean;
    message: string;
}

export declare interface VerifyAndLoginResponse {
    success: boolean;
    message: string;
    userId: string;
    accountId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
}

export declare interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
}

export declare interface ResetPasswordVerifyResponse {
    success: boolean;
    message: string;
    userId: string;
    resetToken: string;
}

export declare interface BusinessTimeType {
    name: string;
    label: string;
}

export declare interface uploadCallBackType{
    success: boolean;
    data: string;
}

export declare interface ErrorResponseType {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
    correlationId?: string;
    serverError?: {
        name?: string;
        stack?: string;
        details?: unknown;
    };
}

export declare interface PrivilegeItem{
    id: UUID;
    name: string;
    code: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
    privilegeActions: PrivilegeActionItem[];
}

export declare interface PrivilegeActionItem{
    id: UUID;
    privilegeSectionName: string;
    action: string;
    privilegeSection: UUID;
    privilegeSectionCode: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}

export declare interface FormPrivilegeActionItem{
    id: UUID;
}

export declare interface StatusItem{
    name: string;
    value: boolean;
}

export declare interface WarehousePrivilegeItem{
    id: UUID;
    name: string;
    code: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
    warehousePrivilegeActions: WarehousePrivilegeActionItem[];
}

export declare interface WarehousePrivilegeActionItem{
    id: UUID;
    warehouseprivilegeSectionName: string;
    action: string;
    warehouseprivilegeSection: UUID;
    warehouseprivilegeSectionCode: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}
