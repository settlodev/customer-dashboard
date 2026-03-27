import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  RefreshCcw,
  Clock,
  CheckCircle,
  Package,
} from "lucide-react";
import DailyRevenueChart from "./Charts/DailyRevenueChart";
import PaymentMethodsChart from "./Charts/PaymentMethodsChart";
import TopSellingItemsChart from "./Charts/TopSellingItemsChart";
import MonthlyCashflowChart from "./Charts/MonthlyCashflowChart";
import StaffPerformanceChart from "./Charts/StaffPerformanceChart";
import RecentTransactionsTable from "./Charts/RecentTransactionsTable";

const StatCard = ({
  label,
  value,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  valueColor?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between p-4 pb-1">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {label}
      </CardTitle>
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
    </CardHeader>
    <CardContent className="px-4 pb-4 pt-0">
      <div
        className={`text-2xl font-bold ${valueColor || "text-gray-900 dark:text-gray-100"}`}
      >
        {typeof value === "string" && value.endsWith("TZS") ? (
          <>
            {value.replace(" TZS", "")}{" "}
            <span className="text-[0.6em] font-normal opacity-70">TZS</span>
          </>
        ) : (
          value
        )}
      </div>
    </CardContent>
  </Card>
);

const SalesDashboard = ({
  salesData,
  variant = "location",
  loyaltyPoints,
  departmentName,
  children,
}: {
  salesData: any;
  variant?: "location" | "staff";
  loyaltyPoints?: number | null;
  departmentName?: string | null;
  children?: React.ReactNode;
}) => {
  const formatAmount = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "0";
    return value.toLocaleString();
  };

  const formatCurrency = (value: number | undefined | null): string => {
    return `${formatAmount(value)} TZS`;
  };

  const CurrencyValue = ({
    value,
    className,
  }: {
    value: number | undefined | null;
    className?: string;
  }) => (
    <span className={className}>
      {formatAmount(value)}{" "}
      <span className="text-[0.6em] font-normal opacity-70">TZS</span>
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Analysis Cards Row */}
      {variant === "staff" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Net Sales Hero Card */}
          <div
            className="relative rounded-xl overflow-hidden shadow-none"
            style={{
              backgroundImage: "url('/images/bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-white/80">
                Net Sales
              </p>
              <p className="text-4xl font-extrabold mt-2 text-primary">
                <CurrencyValue value={salesData?.netSales} />
              </p>
            </div>
          </div>

          {/* Expenses */}
          <Card className="rounded-xl shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Expenses
              </p>
              <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
                <CurrencyValue value={salesData?.totalExpenseRecordedAmount} />
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="text-emerald-600 font-medium">
                  Paid: {formatAmount(salesData?.totalExpensePaidAmount)} TZS
                </span>
                <span className="text-amber-600 font-medium">
                  Unpaid: {formatAmount(salesData?.totalExpenseUnpaidAmount)}{" "}
                  TZS
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Refunds */}
          <Card className="rounded-xl shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Refunds
              </p>
              <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
                <CurrencyValue value={salesData?.totalRefundedAmount} />
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Net Profit Hero Card */}
          <div
            className="relative rounded-xl overflow-hidden shadow-none"
            style={{
              backgroundImage: "url('/images/bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-white/80">
                {salesData?.netProfit >= 0 ? "Net Profit" : "Net Loss"}
              </p>
              <p className="text-4xl font-extrabold mt-2 text-primary">
                <CurrencyValue value={salesData?.netProfit} />
              </p>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <Card className="rounded-xl shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Closing balance
              </p>
              <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
                <CurrencyValue value={salesData?.closingBalance} />
              </p>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card className="rounded-xl shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Expenses
              </p>
              <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
                <CurrencyValue value={salesData?.totalExpenseRecordedAmount} />
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <span className="text-emerald-600 font-medium">
                  Paid: {formatAmount(salesData?.totalExpensePaidAmount)} TZS
                </span>
                <span className="text-amber-600 font-medium">
                  Unpaid: {formatAmount(salesData?.totalExpenseUnpaidAmount)}{" "}
                  TZS
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order & Sales Summary — compact inline */}
      <Card className="shadow-none">
        <CardContent className="flex items-center px-6 py-4 gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Total Orders</span>
            <span className="text-sm font-bold">
              {salesData?.totalOrders || 0}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground">
              Completed Orders
            </span>
            <span className="text-sm font-bold">
              {salesData?.completedOrders || 0}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              Ongoing Orders
            </span>
            <span className="text-sm font-bold">
              {salesData?.ongoingOrders || 0}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">
              Refunded Orders
            </span>
            <span className="text-sm font-bold">
              {salesData?.refundedOrders || 0}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Avg. Order Value
            </span>
            <span className="text-sm font-bold">
              {formatCurrency(salesData?.averageOrderValue)}
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Cost of goods sold
            </span>
            <span className="text-sm font-bold">
              {formatCurrency(salesData?.totalCost)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Revenue stream
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Gross sales"
            value={formatCurrency(salesData?.grossSales)}
            icon={DollarSign}
          />
          <StatCard
            label="Discounts"
            value={formatCurrency(salesData?.totalDiscount)}
            icon={RefreshCcw}
          />
          {variant === "staff" ? (
            <>
              <StatCard
                label="Points"
                value={loyaltyPoints?.toLocaleString() ?? "0"}
                icon={DollarSign}
              />
              <StatCard
                label="Department"
                value={departmentName ?? "—"}
                icon={DollarSign}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Refunds"
                value={formatCurrency(salesData?.totalRefundedAmount)}
                icon={RefreshCcw}
              />
              <StatCard
                label="Net sales"
                value={formatCurrency(salesData?.netSales)}
                icon={DollarSign}
              />
            </>
          )}
        </div>
      </div>

      {/* Extra content (e.g. staff summary cards) */}
      {children}

      {/* Charts Row 1: Daily Revenue + Payment Methods */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <DailyRevenueChart data={salesData?.dailyRevenueTrend} />
        </div>
        <div className="lg:w-auto lg:flex-shrink-0">
          <PaymentMethodsChart data={salesData?.transactionsPerPaymentMethod} />
        </div>
      </div>

      {/* Charts Row 2: Top Items + Monthly Cashflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopSellingItemsChart data={salesData?.topSellingItems} />
        <MonthlyCashflowChart data={salesData?.monthlyCashflow} />
      </div>

      {/* Charts Row 3: Staff Performance + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaffPerformanceChart data={salesData?.staffPerformance} />
        <RecentTransactionsTable data={salesData?.recentTransactions} />
      </div>
    </div>
  );
};

export default SalesDashboard;
