import { UUID } from "crypto"
import { reasonForStockModification } from "../enums"

export declare interface StockModification {
    id: UUID,
    reason:reasonForStockModification
    quantity:number,
    value:number,
    comment:string,
    stock:UUID
    stockVariant:UUID,
    staff:UUID
    stockName:string
    stockVariantName:string
    staffName:string
    dateCreated:string
    status:boolean,
    isArchived:boolean,
    canDelete:boolean
}


