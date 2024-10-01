import { UUID } from "crypto"

export declare interface Subscription {
    id: UUID
    amount: number
    discount: number
    startDate: string
    endDate: string
    packageName: string
    packageCode: string
    status: boolean
    canDelete: boolean
    isTrial: boolean
    isArchived: boolean
}