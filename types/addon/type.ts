import { UUID } from "crypto";
import { StockVariant } from "../stockVariant/type";
import { Recipe } from "../recipe/type";

export declare interface Addon {
    id:UUID;
    title:string;
    location:string;
    price:number;
    isTracked:boolean;
    stockVariant:string;
    recipe:string
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}