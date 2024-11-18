import { UUID } from "crypto";
import { StockVariant } from "../stockVariant/type";
import { Variant } from "../variant/type";

export declare interface Addon {
    id:UUID;
    title:string;
    location:string;
    price:number;
    isTracked:boolean;
    stockVariant:StockVariant;
    variants:Variant[] | Variant ;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}