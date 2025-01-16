import { UUID } from "crypto"

export interface OrderItemRefunds {
    id: UUID
    dateOfReturn: string
    reason: string
    order: UUID
    orderNumber: string
    orderItem: UUID
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





