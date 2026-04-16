export default interface OverviewResponse {
  locationId: string;
  staffId: string | null;
  locationName: string;
  startDate: string;
  endDate: string;

  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  openOrders: number;
  fullyPaidOrders: number;
  partiallyPaidOrders: number;
  unpaidOrders: number;

  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;

  transactionsAmount: number;
  complimentaryAmount: number;
  signedBillAmount: number;
  expensesPaidAmount: number;
  closingBalance: number;

  totalExpenses: number;
  totalExpenseAmount: number;
  totalExpenseUnpaid: number;

  totalRefundCount: number;
  totalRefundedAmount: number;

  paymentMethodBreakdown: PaymentMethodBreakdown[];
  topSellingItems: TopSellingItem[];
}

export interface PaymentMethodBreakdown {
  acceptedPaymentMethodType: string;
  acceptedPaymentMethodTypeName: string;
  paymentType: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export interface TopSellingItem {
  productId: string;
  variantId: string;
  itemName: string;
  imageUrl: string | null;
  departmentName: string;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  grossProfit: number;
}
