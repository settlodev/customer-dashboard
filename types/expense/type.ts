import { UUID } from "crypto"

export declare interface Expense {
    id: UUID
    name: string
    amount: number
    paidAmount:number
    unpaidAmount:number
    staff: UUID
    date: string
    expenseCategory: string
    business: string
    location: string
    canDelete: boolean
    status: boolean
    isArchived: boolean
    paymentStatus:string
    receiptUrl:string
    staffName:string
}

export interface ExpenseReport{
    startDate: Date
    endDate: Date
    totalExpenses: number
    totalExpensesAmount: number
    categorySummaries: categorySummaries[]
}

export interface categorySummaries{
    categoryName: string
    amount: number
    percentage: number
}

export interface ExpenseCategory{
    "id": UUID,
    "name": string,
    "image": string,
    "status": boolean,
    "canDelete": boolean,
    "isArchived": boolean,
}