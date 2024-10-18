import { UUID } from "crypto";

export declare interface Addon {
    id:UUID;
    title:string;
    location:string;
    price:number;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}