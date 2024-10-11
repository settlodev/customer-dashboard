import { UUID } from "crypto";

export declare interface Brand {
    id:UUID;
    name:string;
    location:string;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}