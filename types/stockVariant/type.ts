import { UUID } from 'crypto';

export declare interface StockVariant {
    id: UUID,
    name: string,
    startingValue: number,
    startingQuantity: number,
    alertLevel: number,
    quantity: number,
    imageOption: string,
    status: boolean,
    canDelete: boolean,
    stock: string,
    isArchived: boolean
}

export declare interface StockFormVariant {
    id?: UUID,
    name: string,
    startingValue: number,
    startingQuantity: number,
    alertLevel: number,
    imageOption?: string|undefined|null,
}
