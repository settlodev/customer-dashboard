import { UUID } from "crypto"

export declare type LocationSettings = {
    id: UUID
    minimumuSettlementAmount: number
    systemPassCode: string
    reportsPassCode: string
    isDefault: boolean
    trackInventory: boolean
    ecommerceEnabled: boolean
    enableNotifications: boolean
    useRecipe: boolean
    useDepartments: boolean
    useCustomerPrice: boolean
    useWarehouse: boolean
    useShift: boolean
    useKds: boolean
    isActive: boolean
    locationId: UUID
    status: boolean
    canDelete: boolean
    isArchived: boolean
}