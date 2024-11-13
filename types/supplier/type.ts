import { UUID } from "crypto"

export declare interface Supplier  {
    id: UUID
    name: string
    email: string
    phoneNumber: string
    contactPerson: string
    contactPersonTitle: string
    contactPersonEmail: string
    contactPersonPhoneNumber: string
    physicalAddress: string
    business:string
    location:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
  
}