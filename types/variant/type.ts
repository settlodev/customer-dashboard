import { UUID } from 'crypto';

export declare interface Variant {
    id: UUID,
    name: string,
    price: number,
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
    product: UUID,
    tag: UUID,
    isArchived: boolean,
    unit: string,
    unitName:string,
    trackingType: string | null,
    trackItem: UUID | null,
}
