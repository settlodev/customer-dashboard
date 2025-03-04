export default interface SummaryResponse {
  totalOrders: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  topSellingItems: TopSellingItems[];
  paymentStatusSummary: PaymentStatusSummary;
  paymentMethodTotals: PaymentMethods[];
  periodicSales:salesStats;
  averageSale: number;
  closingBalance: number;
  complimentary: number;
  cost: number;
  discounts: number;
  expense: number;
  grossProfit: number;
  grossSales: number;
  margins: number;
  paidCredit: number;
  salesCount: number;
  unpaidCredit: number;
  advancePayment: number;
  soldItems: SoldItems[];
  numberOfSoldItems: number;
}

export interface PaymentStatusSummary {
  paidOrders: number;
  partiallyPaidOrders: number;
  unpaidOrders: number;
};

export interface PaymentMethods {
  paymentMethodName: string;
  amount: number;
}

export interface salesStats{
  salesPeriod: string;
  periodicSalesValues: periodicSalesValues[];
}
export interface periodicSalesValues {
  time: string;
  totalPaidAmount: number;
}

export interface SoldItems {
    productName:string;
    imageUrl:string;
    quantity:number;
    price:number;
    soldDate:string;
    
  }
  interface TopSellingItems {
    name:string;
    image?:string;
    quantity:number;
    totalRevenue:number;
    
  }
 