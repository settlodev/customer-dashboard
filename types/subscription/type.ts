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

export  interface SubscriptionFeature {
    id: string;
    name: string;
    code: string;
    itemsMaxCount: number | null;
    status: boolean;
    canDelete: boolean;
    isArchived: boolean;
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
    discount: number;
    packageName: string;
    packageCode: string;
    location: UUID
    isDefault: boolean;
    subscription: Subscriptions
    subscriptionFeatures: SubscriptionFeature[],
    includedSubscriptions: Array<{
        packageName: string;
        packageCode: string;
    }>;
    extraFeatures: SubscriptionFeature[];
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