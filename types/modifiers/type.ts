import { UUID } from "crypto";
import { Variant } from "../variant/type";

export declare interface Modifier {
    id:UUID;
    name:string;
    variant:Variant;
    modifierItems: ModifierItems[];
    isMandatory:boolean;
    isMaximum:boolean;
    maximumSelection:number;
    status:boolean;
    canDelete:boolean;
    isArchived:boolean
}

export declare interface ModifierItems {
    name: string;
    price: number;
}