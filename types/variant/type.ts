import { UUID } from 'crypto';
import {Product} from "@/types/product/type";

export declare interface Variant {
    id: UUID,
    name: string,
    price: number,
    cost: number,
    quantity: number,
    sku: string,
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
}

export declare interface FormVariantItem {
    name: string,
    price: number,
    cost: number,
    quantity: number,
    sku: string,
    description: string,
    image: string,
    color: string
}
