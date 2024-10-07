import { UUID } from "crypto"

export declare interface Supplier  {
    id: UUID
    name: string
    email: string
    phoneNumber: string
    business:string
    location:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
  
}