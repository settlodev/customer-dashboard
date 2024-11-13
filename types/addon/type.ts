import { UUID } from "crypto";

export declare interface Addon {
    id:UUID;
    title:string;
    location:string;
    price:number;
    addonTracking:boolean;
    stock:string;
    stockVariant:UUID;
    product:UUID;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}