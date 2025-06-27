import { reasonForStockModification } from "@/types/enums"
import { UUID } from "crypto"

export declare interface StockModification {
    id: UUID,
    reason:reasonForStockModification
    value:number
    quantity:number,
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


