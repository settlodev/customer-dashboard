import {UUID} from "node:crypto";
import {DefaultSession} from "next-auth";

export declare interface LoginResponse {
    id: UUID,
    email: string,
    firstName: string,
    lastName: string,
    picture: string,
    phoneNumber: string,
    authToken: string,
    refreshToken: string,
    phoneNumberVerified: string,
    emailVerified: string,
    consent: boolean,
    theme: string,
    subscriptionStatus: string,
    businessId: UUID
}

export type ApiResponse<T> = {
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

export interface FormResponse {
    responseType: "success" | "error";
    message: string;
    error?: Error | null;
}

export declare interface AuthToken {
    id: string;
    name: string;
    bio: string;
    role: string;
    country: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string|null;
    phoneNumber: string;
    authToken: string;
    refreshToken: string;
    emailVerified: Date | null;
    phoneNumberVerified: Date | null;
    consent: boolean | null;
    theme: string | null;
    subscriptionStatus: string;
    businessComplete: boolean;
    locationComplete: boolean;
    subscriptionComplete: boolean;
    businessId: UUID | null;
    //emailVerificationToken: string|null;
    // businesses: Business[];
    // locations: Location[];
    // activeBusiness: string | null;

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
    avatar: string|null;
    country: UUID;
    role: UUID;
    phoneNumber: string;
    authToken: string;
    refreshToken: string;
    emailVerified: Date | null;
    phoneNumberVerified: Date | null;
    consent: boolean | null;
    theme: string | null;
    subscriptionStatus: string;
    businessComplete: boolean;
    locationComplete: boolean;
    subscriptionComplete: boolean;
    businessId: UUID | null;
    gender: string;
};

export declare interface RegisterResponse {
    message: string;
    success: boolean;
}

export declare interface BusinessTimeType {
    name: string;
    label: string;
}

export declare interface uploadCallBackType{
    success: boolean;
    data: string;
}

export declare interface ServerResponseError{
    message: ErrorMessageType;
    error: object;
}

export declare interface ErrorMessageType{
    status: number;
    code: string;
    message: string;
    error: Error
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


