import { UUID } from "crypto"
import { Modifier } from "../modifiers/type"
import { Addon } from "../addon/type"

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
    removedItems: RemovedItems[]
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
    [key: string]: any
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
   
    [key: string]: any
}

export interface OrderMetrics {
    total: number;
    profitMargin: number;
    totalItems: number;
    averageItemPrice: number;
    processingTime: number;
    processingMinutes: number;
}

export interface DepartmentMetric {
    name: string;
    value: number;
    profit: number;
    count: number;
    revenueShare?: string;
    profitMargin?: string;
    avgItemValue?: string;
}

export interface transactions {
    id: UUID
    order: string
    amount: number
    paymentMethod: string
    paymentMethodName: string
    isArchived: boolean
    dateCreated: string
}

export interface OrderItemRefunds{
    id: UUID,
    quantity: number,
    reason: string,
    dateOfReturn:Date,
    stockReturned:boolean,
    orderItemName:string,
    orderItemId:UUID,
    status: boolean,
    canDelete: boolean,
    staff:string,
    staffName:string,
    approvedBy:string,
    approvedByName:string,
    location: string,
    locationName: string,
    isArchived: boolean,
    comment: string,
}
export interface RemovedItems{
    id: UUID,
    isRemoved: boolean,
    image: string,
    quantity: number,
    name: string,
    hasBeenRefunded: boolean,
    price: number,
    itemPrice: number,
    itemOriginalPrice: number,
    cost: number,
    discountValue: number,
    discountAmount: number,
    netAmount: number,
    grossProfit: number,
    comment: string,
    preparationStatus: boolean,
    staffId: string,
      staffName: string,
      departmentName: string,
      variant: string,
      product: string,
      order: string,
      discountId: UUID,
      stockIntake: string,
      stockIntakeBatchNumber: string,
      modifier:string
    modifierPrice:string
    addons:string
    addonTotalPrice:string
    canDelete: boolean,
    isArchived: boolean,
    status: boolean
}

export interface OrderLogs{
    content: any
    sort(arg0: (a: OrderLogs, b: OrderLogs) => number): unknown
    id:UUID
    orderLogEvent:string
    orderItemName:string
    modifierName:string
    addonName:string
    orderTransactionPaymentMethodName:string
    discountIdName:string
    discountAmountValue:number
    staffName:string
    dateCreated:string
}

export interface CashFlow{
    startDate:Date
    endDate:Date
    transactions:number
    expenses:number
    refunds:number
    transactionsAmount:number
    refundsAmount:number
    expensesPaidAmount:number
    closingBalance:number
    paymentMethodTotals:PaymentMethods[]
}

interface PaymentMethods{
    paymentMethodName:string
    amount:number
}

export interface Credit{
    startDate:Date
    endDate:Date
    total:number
    totalUnpaidAmount:number
    totalPaidAmount:number
    unpaidOrders:UnpaidOrders[]
}

interface UnpaidOrders{
    orderId:UUID
    orderName:string
    orderNumber:string
    openedDate:Date
    paidAmount:number
    unpaidAmount:number
    customerName:string
    customerId:UUID
    firstPaymentDate:Date
    lastPaymentDate:Date
}