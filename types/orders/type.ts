import { UUID } from "crypto"

export interface Orders {
    id: UUID
    name: string
    comment: string
    discountAmount:number
    orderStatus: string
    startedBy: string
    finishedBy: string
    customer: string
    discount: string
    items: OrderItems[]
    orderType: string
    orderPaymentStatus: string
    openedDate: string
    closedDate: string
    location: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export interface OrderItems {
    id: UUID
    order: string
    comment: string
    quantity: number
    variant: string
    discountAmount: number
    preparationStatus: boolean
    discountId: string
    addonId: string
    staffId: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

