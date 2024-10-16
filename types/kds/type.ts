import { UUID } from "crypto"

export declare interface KDS  {
    id: UUID
    name: string
    business:string
    location:string
    department:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
  
}