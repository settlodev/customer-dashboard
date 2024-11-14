import { UUID } from "crypto";

export declare interface Addon {
    id:UUID;
    title:string;
    location:string;
    price:number;
    isTracked:boolean;
    stockVariant:string;
    variants:string[];
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}