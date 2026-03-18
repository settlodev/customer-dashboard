export interface ProductSummaryResponse {
  locationId: string;
  locationName: string;
  productId: string;
  productName: string;
  departmentName: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;

  totalQuantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  averageUnitPrice: number;

  refundedQuantity: number;
  refundedAmount: number;

  variants: ProductVariantSummary[];
  dailySalesTrend: ProductDailySales[];
  staffPerformance: ProductStaffPerformance[];
}

export interface ProductVariantSummary {
  variantId: string;
  itemName: string;
  imageUrl: string | null;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  averageUnitPrice: number;
  refundedQuantity: number;
  refundedAmount: number;
}

export interface ProductDailySales {
  date: string;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
}

export interface ProductStaffPerformance {
  staffId: string;
  staffName: string;
  quantitySold: number;
  salesValue: number;
}
