import { UUID } from "crypto"

export declare interface StockMovement {
    id: UUID,
    quantity:number,
    value:number,
    stockMovementType:string,
    previousAverageValue:number,
    previousTotalQuantity:number,
    newAverageValue:number,
    newTotalQuantity:number,
    stockModification:UUID,
    stockIntake:UUID,
    stockIntakeBatchNumber:string,
    orderItem:UUID,
    orderItemName:string,
    staff:UUID,
    staffName:string,
    stock:UUID,
    stockName:string,
    stockVariant:UUID,
    stockVariantName:string,
    location:UUID,
    status:boolean,
    isArchived:boolean,
    canDelete:boolean
}


