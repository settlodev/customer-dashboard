import { UUID } from "crypto"
import {Variant} from "@/types/variant/type";

export declare interface Product {
    id: UUID,
    name: string,
    slug: string,
    sku: string,
    image: string,
    description: string,
    color: string,
    sellOnline: boolean,
    status: boolean,
    canDelete: boolean,
    business: UUID,
    category: UUID,
    categoryName:string,
    location: UUID,
    department: UUID,
    departmentName: string,
    brand: UUID,
    brandName: string,
    taxClass:string
    taxIncluded:boolean
    isArchived: boolean,
    variants: Variant[],
    trackInventory: boolean
    
}


export declare interface ProductBrand {
    id: UUID,
    name: string,
    status: boolean,
    canDelete: boolean,
    location: UUID,
    isArchived: boolean
}

