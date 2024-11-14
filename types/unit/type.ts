import { UUID } from "crypto"
import { symbol } from "zod"

export interface Units {
    id: UUID
    name: string
    symbol: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}