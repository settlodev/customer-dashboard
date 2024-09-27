import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";

export declare interface CustomerResponse {
    id: UUID;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    location: UUID;
    address: string;
    gender: Gender
    allowNotifications: boolean;
    status:boolean;
    canDelete: boolean;
    isArchived:boolean;
}

export declare interface LoginResponse {
    emailAddress: string;
    password: string;
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
    responseType: string;
    message: string;
    error?: Error | null;
}
