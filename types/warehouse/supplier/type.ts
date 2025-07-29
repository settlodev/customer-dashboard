import { UUID } from "crypto"

export declare interface Supplier  {
    id: UUID
    name: string
    email: string
    phoneNumber: string
    contactPersonName: string
    contactPersonTitle: string
    contactPersonEmail: string
    contactPersonPhone: string
    physicalAddress: string
    business:string
    location:string
    status: boolean
    canDelete: boolean
    isArchived: boolean
}

export interface SupplierCreditReports{
    supplierId: UUID
    supplierName: string
    totalPurchasePerformed: number
    totalPurchasedAmount: number
    totalPaid: number
    totalUnpaidAmount: number
}