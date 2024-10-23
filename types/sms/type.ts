
import { UUID } from "crypto";

export declare interface SMS {
    id: UUID;
    subject: string;
    message: string;
    senderId: string;
    template: string;
    receipt: string;
    location: string;
    scheduled: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}