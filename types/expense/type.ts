import { UUID } from "crypto"

export declare interface Expense {
    id: UUID
    name: string
    amount: number
    date: string
    expenseCategory: string
    business: string
    location: string
    canDelete: boolean
    status: boolean
    isArchived: boolean
}