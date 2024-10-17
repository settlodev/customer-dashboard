import { UUID } from "crypto"

export declare interface Salary  {
    id: UUID
    amount: number
    frequency: number
    accountNumber: string
    bankName: string
    location:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
  
}