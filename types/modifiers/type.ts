import { UUID } from "crypto";


export declare interface Modifier {
    id:UUID;
    name:string;
    variant:string;
    variantName:string;
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