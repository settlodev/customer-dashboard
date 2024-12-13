import { UUID } from "crypto"
import { StockVariant } from "../stockVariant/type";

export declare interface Stock {
    id: UUID,
    name: string,
    description: string,
    status: boolean,
    canDelete: boolean,
    business: UUID,
    location: UUID,
    isArchived: boolean,
    stockVariants: StockVariant[]
}
