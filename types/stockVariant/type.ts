import { UUID } from 'crypto';
import { Stock } from '../stock/type';

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
    stock: Stock,
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
