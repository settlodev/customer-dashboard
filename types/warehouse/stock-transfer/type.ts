import { UUID } from "crypto"

export declare interface StockTransfer {
    id: UUID,
    fromLocation:UUID,
    toLocation:UUID,
    quantity:number,
    value:number,
    comment:string,
    stock:UUID,
    stockVariant:UUID,
    staff:UUID,
    stockName:string,
    stockVariantName:string,
    staffName:string,
    fromLocationName:string,
    toLocationName:string,
    dateCreated:string,
    status:boolean,
    isArchived:boolean,
    canDelete:boolean
}


