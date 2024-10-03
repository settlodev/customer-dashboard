import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";
import {DefaultSession} from "next-auth";
import { decl } from "postcss";

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
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
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
    picture: string;
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
};

export declare interface RegisterResponse {
    message: string;
    success: boolean;
}