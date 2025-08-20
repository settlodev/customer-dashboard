import { UUID } from "crypto"


export interface StockRequestItem {
    warehouseStockVariant: UUID;
    quantity: number;
}
export interface StockRequests{
    id:UUID
    comment:string
    stockRequested:StockRequestItem[]
    quantity:number
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
    approvedDate?:string,
    cancelledDate?:string
    requestedDate?:string
}

export interface StockRequestReport{
    totalStockRequests: number
    approvedStockRequests: number
    pendingStockRequests: number
    cancelledStockRequests: number
}