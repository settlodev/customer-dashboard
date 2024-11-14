import { UUID } from 'crypto';
import {Product} from "@/types/product/type";

export declare interface Variant {
    id: UUID,
    name: string,
    price: number,
 
    quantity: number,
    sku: string,
    barcode: string,
    description: string,
    image: string,
    status: boolean,
    canDelete: boolean,
    color: string,
    taxIncluded: boolean,
    taxAmount: number,
    taxClass: string,
    product: Product,
    tag: UUID,
    isArchived: boolean
    unit: string
    unitName:string
}

export declare interface FormVariantItem {
    id?: UUID,
    name: string,
    price: number,
   
    quantity: number,
    sku?: string|undefined,
    barcode?: string|undefined,
    description?: string|undefined,
    image?: string|undefined|null,
    color?: string|undefined|null,
    unit?: string|undefined
}
