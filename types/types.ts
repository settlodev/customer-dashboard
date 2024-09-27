

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
