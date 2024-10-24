
import { UUID } from "crypto";

export declare interface Email {
    id: UUID;
    subject: string;
    message: string;
    from: string;
    template: string;
    receipt: string;
    location: string;
    sendingOptions: string;
    scheduled: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}