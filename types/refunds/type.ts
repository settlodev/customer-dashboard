import { UUID } from "crypto"

export interface OrderItemRefunds {
    id: UUID
    quantity: number
    dateOfReturn: string
    reason: string
    order: UUID
    orderNumber: string
    orderItem: UUID
    orderItemNetAmount: UUID
    orderItemName: string
    staff: UUID
    staffName: string
    approvedBy: string
    approvedByName: string
    stockReturned: boolean
    locationId: string
    status: boolean
    canDelete: boolean
    isArchived: boolean    
}

export interface RefundReport{
    startDate: Date
    endDate: Date
    totalRefunds: number
    totalRefundsAmount: number
    totalReturnedCost: number
    refundedItems: ItemRefunds[]

}

export interface ItemRefunds{
    orderItemName: string
    staffName: string
    quantity: number
    refundAmount: number
    returnedCost: number
    latestRefunded:Date
    earliestRefunded:Date
}





