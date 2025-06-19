import { UUID } from "crypto"

export declare type LocationSettings = {
    id: UUID
    minimumuSettlementAmount: number
    systemPasscode: string
    reportsPasscode: string
    isDefault: boolean
    trackInventory: boolean
    ecommerceEnabled: boolean
    enableNotifications: boolean
    useRecipe: boolean
    useDepartments: boolean
    useCustomerPrice: boolean
    useWarehouse: boolean
    enableEmailNotifications: boolean,
    enableSmsNotifications: boolean,
    enablePushNotifications: boolean,
    enableOrdersPrintsCount: boolean,
    useShifts: boolean
    useKds: boolean
    isActive: boolean
    locationId: UUID
    status: boolean
    canDelete: boolean
    isArchived: boolean
}