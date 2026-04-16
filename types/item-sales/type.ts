export interface ItemSalesAggregate {
  productId: string;
  variantId: string;
  itemName: string;
  departmentName: string | null;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
}

export interface ItemSalesSummary {
  locationId: string;
  staffId: string | null;
  startDate: string;
  endDate: string;
  totalItemsSold: number;
  totalQuantitySold: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalDiscount: number;
  totalCost: number;
  totalGrossProfit: number;
  items: ItemSalesAggregate[];
}
