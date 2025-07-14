import { UUID } from "crypto"

export interface StockRequests{
    id:UUID
    comment:string
    quantity:number
    warehouseRequestStatus:string
    approvedDate?:string
    fromLocation:UUID
    fromLocationName:string
    toWarehouse:UUID
    toWarehouseName:string
    locationStaffRequested:UUID
    locationStaffRequestedName:string
    warehouseStaffApproved:UUID
    warehouseStaffApprovedName:string
    warehouseStock:UUID
    warehouseStockName:string
    warehouseStockVariant:UUID
    warehouseStockVariantName:string
}

export interface StockRequestReport{
    totalStockRequests: number
    approvedStockRequests: number
    pendingStockRequests: number
    cancelledStockRequests: number
}