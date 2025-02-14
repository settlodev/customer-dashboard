import { UUID } from "crypto"

export interface Orders {
    id: UUID
    orderNumber: string
    name: string
    comment: string
    amount: number
    discountAmount:number
    discountValue: number
    totalDiscountIncludingItems: number
    grossProfit: number
    grossAmount: number
    netAmount: number
    totalCost: number
    totalDiscount: number
    unpaidAmount: number
    paidAmount: number
    platformType: string
    isBooked: boolean
    efdPrinted: boolean
    isTransferred: boolean
    reservation: string
    table: string
    orderStatus: string
    startedBy: string
    startedByName: string
    finishedBy: string
    finishedByName: string
    customer: string
    customerName: string
    discount: string
    discountName: string
    items: OrderItems[]
    orderItemRefunds:OrderItemRefunds[]
    orderType: string
    paymentType: string
    orderPaymentStatus: string
    openedDate: string
    closedDate: string
    transactions:transactions[]
    total: number
    amountDue: number
    location: string
    businessName: string
    locationName: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export interface OrderItems {
    id:UUID
    name:string
    quantity:number
    image:string
    hasBeenRefunded:boolean
    price:number
    itemPrice:number
    cost:number
    discountValue:number
    discountAmount:number
    netAmount:number
    grossProfit:number
    comment:string
    preparationStatus:boolean
    canDelete:boolean
    isArchived:boolean
    status:boolean
    staffId:UUID
    staffName:string
    departmentName:string
    variant:UUID
    discountId:UUID
    stockIntake:string
    stockIntakeBatchNumber:string
    modifier:string
    modifierPrice:string
    addons:string
    addonTotalPrice:string
}

export interface transactions {
    id: UUID
    order: string
    amount: number
    paymentMethod: string
    paymentMethodName: string
    isArchived: boolean
}

export interface OrderItemRefunds{
    id: UUID,
    quantity: number,
    reason: string,
    dateOfReturn:Date,
    stockReturned:boolean,
    orderItemName:string,
    status: boolean,
    canDelete: boolean,
    staff:string,
    staffName:string,
    approvedBy:string,
    approvedByName:string,
    location: string,
    isArchived: boolean
}

