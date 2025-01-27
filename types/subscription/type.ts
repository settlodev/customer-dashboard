import { UUID } from "crypto"

export declare interface Subscription {
    id: UUID
    amount: number
    discount: number
    startDate: string
    endDate: string
    packageName: string
    packageCode: string
    subscriptionFeatures: SubscriptionFeature[],
    includedSubscriptions:IncludedSubscription[],
    extraFeatures: ExtraFeature[]
    status: boolean
    canDelete: boolean
    isTrial: boolean
    isArchived: boolean
}

export declare interface SubscriptionFeature {
    id: UUID
    name: string
    code: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export declare interface IncludedSubscription {
   packageName: string
   packageCode: string
}

export declare interface ExtraFeature {
    id: UUID
    name: string
    code: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export declare interface ActiveSubscription{
    id: UUID
    amount: number
    startDate: Date
    endDate: Date
    subscriptionStatus: string
    active:boolean
    location: UUID
    subscription: Subscription
    status: boolean
    canDelete: boolean
    isArchived: boolean
}