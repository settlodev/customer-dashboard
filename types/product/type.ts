import { UUID } from "crypto";
import { Variant } from "@/types/variant/type";

export declare interface Product {
  id: UUID;
  name: string;
  slug: string;
  sku: string;
  image: string;
  description: string;
  color: string;
  sellOnline: boolean;
  status: boolean;
  canDelete: boolean;
  business: UUID;
  category: UUID;
  categoryName: string;
  location: UUID;
  department: UUID;
  departmentName: string;
  brand: UUID;
  brandName: string;
  taxClass: string;
  taxIncluded: boolean;
  isArchived: boolean;
  variants: Variant[];
  trackInventory: boolean;
  trackingType: "recipe" | "stock" | null;
  quantity: number;
}

export declare interface TopSellingProduct {
  startDate: Date;
  endDate: Date;
  locationName: string;
  items: TopItems[];
  totalRevenue: number;
  totalQuantitySold: number;
  soldItemsReport: SoldItemsReport;
}

export interface TopItems {
  name: string;
  productName: string;
  variantName: string;
  categoryName: string;
  imageUrl: string;
  staffName: string;
  quantity: number;
  revenue: number;
  percentageOfTotal: number;
  averagePrice: number;
  latestSoldDate: Date;
  earliestSoldDate: Date;
}

export interface SoldItemsReport {
  locationName: string;
  startDate: string | Date;
  endDate: string | Date;
  items: SoldItem[];
  totalQuantity: number;
  netQuantity: number;
  totalRevenue: number;
  totalGrossRevenue: number;
  totalCost: number | null;
  netCost: number | null;
  totalProfit: number;
  totalDiscount: number;
  totalRefundedAmount: number;
  averageMargin: number;
  // legacy / optional
  netProfit?: number;
}

export interface SoldItem {
  productId?: string;
  variantId?: string;
  name?: string;
  productName: string;
  variantName: string;
  categoryName: string;
  staffName: string | null;
  imageUrl: string | null;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
  netProfit: number;
  margin: number;
  averageSellingPrice?: number;
  orderCount?: number;
  grossRevenue?: number;
  refundedQuantity: number;
  refundedPrice: number;
  netPrice: number;
  refundedCost: number;
  netQuantity: number;
  netCost: number;
  latestSoldDate: string;
  earliestSoldDate: string;
  discountIncludingOrderDiscountPortion: number;
}
