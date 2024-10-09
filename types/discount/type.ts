import { UUID } from "crypto"

export declare interface Discount {
    id: UUID
    name: string
    discountValue: number
    validFrom: string
    validTo: string
    discountCode: string
    minimumSpend: number
    discountType: string
    usageLimit: number
    activations: number
    department: string
    location: string
    customer: string
    category: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}