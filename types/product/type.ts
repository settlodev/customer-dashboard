import { UUID } from "crypto"
import {Variant} from "@/types/variant/type";

export declare interface Product {
    id: UUID,
    name: string,
    slug: string,
    sku: string,
    image: string,
    description: string,
    color: string,
    sellOnline: boolean,
    status: boolean,
    canDelete: boolean,
    business: UUID,
    category: UUID,
    categoryName:string,
    location: UUID,
    department: UUID,
    departmentName: string,
    brand: UUID,
    brandName: string,
    taxClass:string
    taxIncluded:boolean
    isArchived: boolean,
    variants: Variant[],
    trackInventory: boolean,
    trackingType: "recipe" | "stock" | null,
}

export declare interface TopSellingProduct{
    startDate: Date,
    endDate: Date,
    locationName: string,
    topItems: topItems[]
    totalRevenue: number,
    totalQuantitySold: number,
    soldItemsReport: SoldItemsReport
}

interface topItems{
    productName: string,
    variantName: string,
    categoryName: string,
    quantity: number,
    revenue: number
    percentageOfTotal: number
    averagePrice: number
}
export interface SoldItemsReport {
    items: SoldItem[]; // Changed to an array of SoldItem
    totalQuantity: number;
    totalRevenue: number;
    totalCost: number | null; // Assuming cost can be null
    totalProfit: number;
    averageMargin: number;
}
export interface SoldItem{
    productName: string,
    variantName: string,
    categoryName: string,
    staffName: string,
    imageUrl: string
    quantity: number,
    price: number,
    cost: number,
    profit: number,
    margin: number,
    soldDate: string
}

