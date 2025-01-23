import { UUID } from "crypto"

export declare interface RenewSubscription {
    planId: UUID
    quantity: number
    discount: UUID
    email: string
    phone: string
    userId: UUID
    locationId: UUID
    providerId: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}
