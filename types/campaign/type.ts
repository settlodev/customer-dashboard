
import { UUID } from "crypto";
import { audienceType } from "../enums";

export declare interface Campaign {
    id: UUID;
    name: string;
    subject: string;
    message: string;
    senderId: string;
    template: string;
    audience: audienceType;
    location: string;
    business: string;
    sendingOptions: string;
    scheduled: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}