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
  paymentStatusSummary: {
    paidOrders: number;
    partiallyPaidOrders: number;
    unpaidOrders: number;
  };
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


export interface SoldItems {
    name:string;
    image:string;
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
 