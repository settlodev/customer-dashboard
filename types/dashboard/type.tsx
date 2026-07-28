export default interface SummaryResponse {
  locationId: string;
  locationName: string;
  startDate: string;
  endDate: string;

  closingBalance: number;
  transactionsAmount: number;
  refundsAmount: number;
  expensesPaidAmount: number;

  grossSales: number;
  netSales: number;
  netProfit: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;

  expenseCount: number;
  totalExpenseRecordedAmount: number;
  totalExpensePaidAmount: number;
  totalExpenseUnpaidAmount: number;
  totalTips: number;

  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  ongoingOrders: number;
  refundedOrders: number;
  averageOrderValue: number;

  totalRefundCount: number;
  totalRefundedAmount: number;

  uniqueCustomers: number;

  transactionsPerPaymentMethod: TransactionsByPaymentMethod[];
  recentTransactions: RecentTransaction[];
  topSellingItems: TopSellingItem[];
  dailyRevenueTrend: DailyRevenue[];
  monthlyCashflow: MonthlyCashflow[];
  staffPerformance: StaffPerformance[];
}

export interface TransactionsByPaymentMethod {
  acceptedPaymentMethodType: string;
  acceptedPaymentMethodTypeName: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number;
}

export interface RecentTransaction {
  id: string;
  transactionId: string;
  orderNumber: string;
  acceptedPaymentMethodTypeName: string;
  amount: number;
  staffName: string;
  createdAt: string;
}

export interface TopSellingItem {
  productId: string;
  itemName: string;
  departmentName: string;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  grossProfit: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  expenses: number;
  ordersCount: number;
}

export interface MonthlyCashflow {
  month: string;
  transactionsTotal: number;
  transactionsCount: number;
  expensesTotal: number;
  expensesCount: number;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  ordersCount: number;
  ordersValue: number;
}
