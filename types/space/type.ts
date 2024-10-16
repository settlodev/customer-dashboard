import { UUID } from "crypto"

export declare interface Space  {
    id: UUID
    name: string
    business:string
    location:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
  
}