import { UUID } from "crypto";

export declare interface Country {
    id: UUID;
    name: string;
    code: string;
    locale: string;
    currencyCode: string;
    supported: boolean;
}