import { UUID } from "crypto";

export declare interface Shift {
    id: UUID;
    name: string;
    startTime: string;
    endTime: string;
    business: string;
    location: string;
    department: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}