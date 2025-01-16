import { UUID } from "crypto"
import { StockVariant } from "../stockVariant/type";

export declare interface Stock {
    id: UUID,
    name: string,
    description: string,
    unit: string,
    status: boolean,
    canDelete: boolean,
    business: UUID,
    location: UUID,
    isArchived: boolean,
    stockVariants: StockVariant[]
}

export declare interface StockHistory {
    totalStockIntakes: number,
    totalStockRemaining: number,
    lowStockItems: lowStockItems[],
    outOfStockItems: outOfStockItems[]
}

interface lowStockItems  {
    stockName: string,
    stockVariantName: string,
    remainingAmount: number
}

interface outOfStockItems{
    stockName: string,
    stockVariantName: string
}
