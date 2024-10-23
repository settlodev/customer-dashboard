import { UUID } from "crypto";
import { broadcastType } from "../enums";

export declare interface Template {
    id: UUID;
    message:string;
    subject:string;
    broadcastType: broadcastType;   
    location: string;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
}