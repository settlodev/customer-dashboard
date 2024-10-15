import { UUID } from "crypto";

export declare interface Country {
    id: UUID;
    name: string;
    code: string;
    currencyCode: string;
    locale: string;
    supported: boolean;
    isArchived: boolean
    canDelete: boolean
    status: boolean
}