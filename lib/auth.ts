import {UUID} from "node:crypto";

export declare interface AuthToken {
    firstName: string;
    name?: string | null;
    id?: string;
    authToken: string;
    refreshToken: string;
    businessComplete: boolean;
    kycComplete: boolean;
    consent: boolean | null;
    theme: string | null;
    subscriptionStatus: string;
    locationId: UUID;
}
