import { UUID } from "crypto"

export declare interface StockIntake {
    id: UUID,
    quantity: number,
    stockAndStockVariantName: string,
    value: number,
    batchExpiryDate: string,
    orderDate: string,
    deliveryDate: string,
    status: boolean,
    canDelete: boolean,
    isArchived: boolean,
    stockName: string
    stockVariant: UUID
    stockVariantName: string
    supplier: UUID
    supplierName: string
    staff: UUID
    staffName: string
    stock:UUID
    purchasePaidAmount: number
}


