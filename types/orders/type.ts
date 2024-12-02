import { UUID } from "crypto"

export interface Orders {
    id: UUID
    orderNumber: string
    name: string
    comment: string
    amount: number
    discountAmount:number
    orderStatus: string
    startedBy: string
    startedByName: string
    finishedBy: string
    finishedByName: string
    customer: string
    customerName: string
    discount: string
    items: OrderItems[]
    orderType: string
    orderPaymentStatus: string
    openedDate: string
    closedDate: string
    transactions:transactions[]
    total: number
    amountDue: number
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
    image: string
    name: string
    price: number
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

export interface transactions {
    id: UUID
    order: string
    amount: number
    paymentMethod: string
    paymentMethodName: string
    isArchived: boolean
}

