import { UUID } from "crypto";
import { Variant } from "../variant/type";


export declare interface Recipe {
    id:UUID;
    name:string;
    recipeStockVariants:recipeVariants[];
    variant:Variant;
    location:string;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}

export declare interface recipeVariants {
    stockVariant:string;
    stockVariantName:string;
    quantity:number;
}