import { UUID } from "crypto";
import { StockVariant } from "../stockVariant/type";
import { Recipe } from "../recipe/type";

export declare interface Addon {
    id:UUID;
    title:string;
    location:UUID;
    price:number;
    isTracked:boolean;
    stockVariant:StockVariant;
    recipe:Recipe;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}