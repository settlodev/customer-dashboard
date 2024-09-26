import {UUID} from "node:crypto";
import {Gender} from "@/types/enums";

export declare interface Customer {
    id: UUID;
    name: string;
    emailAddress: string;
    phoneNumber: string;
    location: UUID;
    address: string;
    gender: Gender;
    nationality: string;
    dateOfBirth: Date;
    allowNotifications: boolean;
    notes: string;
    points: 0;
    lastVisit: Date;
    totalSpend: number;
    canDelete: boolean;
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
