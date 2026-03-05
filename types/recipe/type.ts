import { UUID } from "crypto";
import { Variant } from "../variant/type";


export declare interface Recipe {
    id:UUID;
    name:string;
    recipeStockVariants:recipeVariants[];
    image:string;
    cost:number;
    variant:Variant;
    variantName:string;
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