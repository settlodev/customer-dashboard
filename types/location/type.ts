import { UUID } from "crypto"
import { subscriptionStatus } from "../enums"

export declare interface Location  {
    id: UUID
    name: string
    phone:string
    email:string
    description: string
    address: string
    city: string
    region: string
    street: string
    openTime: string
    closingTime: string
    status: boolean
    canDelete: boolean
    isArchived: boolean
    settings: string
    business:string
    subscriptionStatus: subscriptionStatus
}