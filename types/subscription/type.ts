import { UUID } from "crypto"

export declare interface Subscriptions {
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
    subscription: Subscriptions
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export declare interface ValidDiscountCode {
    discount: UUID
    validityStatus: string
    discountCode: string
    discountType: string
    name: string
    discountValue: number
    validFrom: Date
    validTo: Date
    minimumSpend: number
    remainingUses: number
    restrictedToCategory: string
    restrictedToCustomer: string
    restrictedToLocation: string
    errorCode: string
    errorDescription: string
}